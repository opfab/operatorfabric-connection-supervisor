
/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import e from "express";
import UserStates from "./userStates";

export default class ConnectionChecker {

  opfabInterface: any;
  userStates = new UserStates();
  logger :any;
  nbOfConsecutiveNotConnectedToSendFirstCard: any;
  nbOfConsecutiveNotConnectedToSendSecondCard: any;
  minuteDisconnectedForFirstCard: any;
  minuteDisconnectedForSecondCard: any;
  secondsBetweenConnectionChecks: any;
  supervisorList: any;
  userList: any;

  setOpfabInterface(opfabInterface: any) {
    this.opfabInterface = opfabInterface; 
    return this;
  }

  setLogger(logger:any) {
    this.logger = logger;
    return this;
  }

  setSecondsBetweenConnectionChecks(secondsBetweenConnectionChecks: any) {
   this.secondsBetweenConnectionChecks = secondsBetweenConnectionChecks;
   return this;
  }

  setNbOfConsecutiveNotConnectedToSendFirstCard(nbOfConsecutiveNotConnectedToSendFirstCard: any) {
    this.nbOfConsecutiveNotConnectedToSendFirstCard = nbOfConsecutiveNotConnectedToSendFirstCard;
    this.minuteDisconnectedForFirstCard = (this.secondsBetweenConnectionChecks * this.nbOfConsecutiveNotConnectedToSendFirstCard) / 60;
    return this;
  }

  setNbOfConsecutiveNotConnectedToSendSecondCard(nbOfConsecutiveNotConnectedToSendSecondCard:any) {
    this.nbOfConsecutiveNotConnectedToSendSecondCard = nbOfConsecutiveNotConnectedToSendSecondCard;
    this.minuteDisconnectedForSecondCard = (this.secondsBetweenConnectionChecks * nbOfConsecutiveNotConnectedToSendSecondCard) / 60;
    return this;
  }

  setUsersToSupervise(usersToSupervise:any) {;
    this.supervisorList = new Map();
    this.userList = [];
    usersToSupervise.forEach((user:any) => {
      this.userList.push(user.login);
      this.supervisorList.set(user.login, user.supervisors);
    });
    this.userStates.setUsersToSupervise(this.userList);
    return this
  }

  resetState() {
    this.userStates.reset();
  }

  async checkConnection () {
    try {
        const users = await this.opfabInterface
            .getUsersConnected()
            .catch((e:Error) => {this.logger.warn('Impossible to get user connected card ');throw e});
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
                    .catch((e:any) => this.logger.warn('Impossible to send first card ', e));
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
                    .catch((e:any) => this.logger.warn('Impossible to send second card ', e));
            });
        }
    } catch (error) {
        this.logger.warn('Error in processing : ', error);
    }
} 
  
}
