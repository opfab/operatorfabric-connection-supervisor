
/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import UserStates from "./userStates.mjs";

export default class ConnectionChecker {

  opfabInterface;
  userStates = new UserStates();
  logger;
  nbOfConsecutiveNotConnectedToSendFirstCard;
  nbOfConsecutiveNotConnectedToSendSecondCard;
  minuteDisconnectedForFirstCard;
  minuteDisconnectedForSecondCard;
  supervisorList;
  userList;

  setOpfabInterface(opfabInterface) {
    this.opfabInterface = opfabInterface; 
    return this;
  }

  setLogger(logger) {
    this.logger = logger;
    return this;
  }

  setSecondsBetweenConnectionChecks(secondsBetweenConnectionChecks) {
   this.secondsBetweenConnectionChecks = secondsBetweenConnectionChecks;
   return this;
  }

  setNbOfConsecutiveNotConnectedToSendFirstCard(nbOfConsecutiveNotConnectedToSendFirstCard) {
    this.nbOfConsecutiveNotConnectedToSendFirstCard = nbOfConsecutiveNotConnectedToSendFirstCard;
    this.minuteDisconnectedForFirstCard = (this.secondsBetweenConnectionChecks * this.nbOfConsecutiveNotConnectedToSendFirstCard) / 60;
    return this;
  }

  setNbOfConsecutiveNotConnectedToSendSecondCard(nbOfConsecutiveNotConnectedToSendSecondCard) {
    this.nbOfConsecutiveNotConnectedToSendSecondCard = nbOfConsecutiveNotConnectedToSendSecondCard;
    this.minuteDisconnectedForSecondCard = (this.secondsBetweenConnectionChecks * nbOfConsecutiveNotConnectedToSendSecondCard) / 60;
    return this;
  }

  setUsersToSupervise(usersToSupervise) {;
    this.supervisorList = new Map();
    this.userList = [];
    usersToSupervise.forEach((user) => {
      this.userList.push(user.login);
      this.supervisorList.set(user.login, user.supervisors);
    });
    this.userStates.setUsersToSupervise(this.userList);
    return this
  }

  async checkConnection () {
    try {
        const users = await this.opfabInterface
            .getUsersConnected()
            .catch((e) => {this.logger.warn('Impossible to get user connected card ');throw e});
        this.logger.info('Users connected : ' + users);

        if (users) {
            this.userStates.setUsersConnected(users);
            let usersNotConnected = this.userStates.getUsersNotConnectedForConsecutiveTimes(
                this.nbOfConsecutiveNotConnectedToSendFirstCard
            );
            if (usersNotConnected.length > 0)
                this.logger.info(
                    usersNotConnected +
                        ' is(are) not connected for ' +
                        this.nbOfConsecutiveNotConnectedToSendFirstCard +
                        ' consecutive times'
                );
            usersNotConnected.forEach(async (user) => {
                await this.opfabInterface
                    .sendCard(user, this.supervisorList.get(user), this.minuteDisconnectedForFirstCard)
                    .catch((e) => this.logger.warn('Impossible to send first card ', e));
            });

            usersNotConnected = this.userStates.getUsersNotConnectedForConsecutiveTimes(
                this.nbOfConsecutiveNotConnectedToSendSecondCard
            );
            if (usersNotConnected.length > 0)
                this.logger.info(
                    usersNotConnected +
                        ' is(are) not connected for ' +
                        this.nbOfConsecutiveNotConnectedToSendSecondCard +
                        ' consecutive times'
                );
            usersNotConnected.forEach(async (user) => {
                await this.opfabInterface
                    .sendCard(user, this.supervisorList.get(user), this.minuteDisconnectedForSecondCard)
                    .catch((e) => this.logger.warn('Impossible to send second card ', e));
            });
        }
    } catch (error) {
        this.logger.warn('Error in processing : ', error);
    }
} 
  
}
