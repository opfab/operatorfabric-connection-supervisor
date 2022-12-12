/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import GetConnectedUsersResponse from '../server-side/getConnectedUsersResponse';
import OpfabInterface from '../server-side/opfabInterface';
import UserConnectionsStates from './userConnectionsStates';

export default class ConnectionChecker {
    private opfabInterface: OpfabInterface;
    private userConnectionsStates = new UserConnectionsStates();
    private logger: any;
    private nbOfConsecutiveNotConnectedToSendFirstCard: number;
    private nbOfConsecutiveNotConnectedToSendSecondCard: number;
    private secondsBetweenConnectionChecks: number;
    private supervisorList: any;
    private userList: any;

    public setOpfabInterface(opfabInterface: OpfabInterface) {
        this.opfabInterface = opfabInterface;
        return this;
    }

    public setLogger(logger: any) {
        this.logger = logger;
        return this;
    }

    public setSecondsBetweenConnectionChecks(secondsBetweenConnectionChecks: number) {
        this.secondsBetweenConnectionChecks = secondsBetweenConnectionChecks;
        return this;
    }

    public setNbOfConsecutiveNotConnectedToSendFirstCard(nbOfConsecutiveNotConnectedToSendFirstCard: number) {
        this.nbOfConsecutiveNotConnectedToSendFirstCard = nbOfConsecutiveNotConnectedToSendFirstCard;
        return this;
    }

    public setNbOfConsecutiveNotConnectedToSendSecondCard(nbOfConsecutiveNotConnectedToSendSecondCard: number) {
        this.nbOfConsecutiveNotConnectedToSendSecondCard = nbOfConsecutiveNotConnectedToSendSecondCard;
        return this;
    }

    public setUsersToSupervise(usersToSupervise: any) {
        this.supervisorList = new Map();
        this.userList = [];
        usersToSupervise.forEach((user: any) => {
            this.userList.push(user.login);
            this.supervisorList.set(user.login, user.supervisors);
        });
        this.userConnectionsStates.setUsersToSupervise(this.userList);
        return this;
    }

    public resetState() {
        this.userConnectionsStates.reset();
    }

    public async checkConnection() {
        const getConnectedUsersResponse: GetConnectedUsersResponse = await this.opfabInterface.getUsersConnected();
        if (!getConnectedUsersResponse.isValid()) return;
        
        const connectedUsers = getConnectedUsersResponse.getData();
        this.logger.info('Users connected : ' + connectedUsers);

        if (connectedUsers) {
            this.userConnectionsStates.setUsersConnected(connectedUsers);
            this.sendCardsToUsersNotConnectedFor(this.nbOfConsecutiveNotConnectedToSendFirstCard);
            this.sendCardsToUsersNotConnectedFor(this.nbOfConsecutiveNotConnectedToSendSecondCard);
        }
    }

    private sendCardsToUsersNotConnectedFor(nbOfConsecutiveNotConnected: number) {
        const usersNotConnected =
            this.userConnectionsStates.getUsersNotConnectedForConsecutiveTimes(nbOfConsecutiveNotConnected);
        if (usersNotConnected.length > 0)
            this.logger.info(
                usersNotConnected + ' is(are) not connected for ' + nbOfConsecutiveNotConnected + ' consecutive times'
            );
        usersNotConnected.forEach(async (user) => {
            await this.opfabInterface.sendCard(
                user,
                this.supervisorList.get(user),
                (this.secondsBetweenConnectionChecks * nbOfConsecutiveNotConnected) / 60
            );
        });
    }
}
