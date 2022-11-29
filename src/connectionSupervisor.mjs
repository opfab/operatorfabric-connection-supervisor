
/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import UserStates from './userStates.mjs'
import OpfabInterface from './opfabInterface.mjs'
import config from 'config';
import logger from './logger.mjs';


const opfabInterface = (new OpfabInterface())
    .setLogin(config.get('opfab.login'))
    .setPassword(config.get('opfab.password'))
    .setOpfabGetUsersConnectedUrl(config.get('opfab.consultationUrl'))
    .setOpfabPublicationUrl(config.get('opfab.publicationUrl'))
    .setOpfabGetTokenUrl(config.get('opfab.getTokenUrl'))
    .setCardTemplate(config.get("cardTemplate"));

const usersToSupervise = config.get('usersToSupervise');
const secondsBetweenConnectionChecks = config.get('secondsBetweenConnectionChecks');
const userStates = new UserStates();
userStates.setUsersToSupervise(usersToSupervise);

logger.info("Start")

checkRegulary();



async function checkRegulary() {
    try {
        const users = await opfabInterface.getUsersConnected();
        logger.info('Users connected : ' + users);
        userStates.setUsersConnected(users);
        const usersNotConnected = userStates.getUsersNotConnectedForConsecutiveTimes(3);
        logger.info('Not connected = ' +  usersNotConnected);
        usersNotConnected.forEach( async (user) => {
            await opfabInterface.sendCard(user);
        })
        
    } catch (error) {
        console.log('Impossible to get users connected  , error =  ', error);
    }

    setTimeout(() => checkRegulary(), secondsBetweenConnectionChecks);
}
