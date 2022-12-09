/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import express from 'express';
import config from 'config';
import logger from './domain/server-side/logger';
import OpfabInterface from './domain/server-side/opfabInterface';
import ConnectionSupervisorService from './domain/client-side/connectionSupervisorService';

const app = express();
const adminPort = config.get('adminPort');
const usersToSupervise = config.get('usersToSupervise');
const secondsBetweenConnectionChecks: number = config.get('secondsBetweenConnectionChecks');
const nbOfConsecutiveNotConnectedToSendFirstCard = config.get('nbOfConsecutiveNotConnectedToSendFirstCard');
const nbOfConsecutiveNotConnectedToSendSecondCard = config.get('nbOfConsecutiveNotConnectedToSendSecondCard');
const activeOnStartUp = config.get('activeOnStartup');


const opfabInterface = new OpfabInterface()
    .setLogin(config.get('opfab.login'))
    .setPassword(config.get('opfab.password'))
    .setOpfabGetUsersConnectedUrl(config.get('opfab.consultationUrl'))
    .setOpfabPublicationUrl(config.get('opfab.publicationUrl'))
    .setOpfabGetTokenUrl(config.get('opfab.getTokenUrl'))
    .setCardTemplate(config.get('cardTemplate'));


const supervisorConfig: any = { 
    secondsBetweenConnectionChecks: secondsBetweenConnectionChecks,
    nbOfConsecutiveNotConnectedToSendFirstCard: nbOfConsecutiveNotConnectedToSendFirstCard,
    nbOfConsecutiveNotConnectedToSendSecondCard: nbOfConsecutiveNotConnectedToSendSecondCard,
    usersToSupervise: usersToSupervise
}

const connectionSupervisorService = new ConnectionSupervisorService(supervisorConfig,opfabInterface,logger)

app.get('/status', (req, res) => {
    res.send(activeOnStartUp);
});

app.get('/start', (req, res) => {
    logger.info('Start supervisor asked');
    connectionSupervisorService.start();
    res.send('Start supervisor');
});

app.get('/stop', (req, res) => {
    logger.info('Stop supervisor asked');
    connectionSupervisorService.stop();
    res.send('Stop supervisor');
});

app.listen(adminPort, () => {
    logger.info(`Opfab connection supervisor listening on port ${adminPort}`);
});

logger.info('Application started');

if (activeOnStartUp)  connectionSupervisorService.start();
