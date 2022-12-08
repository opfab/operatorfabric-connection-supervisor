/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import OpfabInterface from './domain/server-side/opfabInterface.mjs';
import ConnectionChecker from './domain/application/connectionChecker.mjs';
import config from 'config';
import logger from './domain/server-side/logger.mjs';
import express from 'express';

const app = express();
const adminPort = config.get('adminPort');
const usersToSupervise = config.get('usersToSupervise');
const secondsBetweenConnectionChecks = config.get('secondsBetweenConnectionChecks');
const nbOfConsecutiveNotConnectedToSendFirstCard = config.get('nbOfConsecutiveNotConnectedToSendFirstCard');
const nbOfConsecutiveNotConnectedToSendSecondCard = config.get('nbOfConsecutiveNotConnectedToSendSecondCard');
let active = config.get('activeOnStartup');



const opfabInterface = new OpfabInterface()
    .setLogin(config.get('opfab.login'))
    .setPassword(config.get('opfab.password'))
    .setOpfabGetUsersConnectedUrl(config.get('opfab.consultationUrl'))
    .setOpfabPublicationUrl(config.get('opfab.publicationUrl'))
    .setOpfabGetTokenUrl(config.get('opfab.getTokenUrl'))
    .setCardTemplate(config.get('cardTemplate'));

const connectionChecker = new ConnectionChecker()
.setLogger(logger)
.setOpfabInterface(opfabInterface)
.setSecondsBetweenConnectionChecks(secondsBetweenConnectionChecks)
.setNbOfConsecutiveNotConnectedToSendFirstCard(nbOfConsecutiveNotConnectedToSendFirstCard)
.setNbOfConsecutiveNotConnectedToSendSecondCard(nbOfConsecutiveNotConnectedToSendSecondCard)
.setUsersToSupervise(usersToSupervise)

app.get('/status', (req, res) => {
    res.send(active);
});

app.get('/start', (req, res) => {
    logger.info('Start supervisor asked');
    active = true;
    res.send('Start supervisor');
});

app.get('/stop', (req, res) => {
    logger.info('Stop supervisor asked');
    active = false;
    userStates.reset();
    res.send('Stop supervisor');
});

app.listen(adminPort, () => {
    logger.info(`Opfab connection supervisor listening on port ${adminPort}`);
});

logger.info('Start');




checkRegulary();


async function checkRegulary() {
    if (active) {
        connectionChecker.checkConnection();      
    }
    setTimeout(() => checkRegulary(), secondsBetweenConnectionChecks * 1000);
}
 