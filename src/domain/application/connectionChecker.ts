
/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import UserStates from "./userStates";

export default class ConnectionChecker {

  private opfabInterface: any;
  private userStates = new UserStates();
  private logger :any;
  private nbOfConsecutiveNotConnectedToSendFirstCard: any;
  private nbOfConsecutiveNotConnectedToSendSecondCard: any;
  private minuteDisconnectedForFirstCard: any;
  private minuteDisconnectedForSecondCard: any;
  private secondsBetweenConnectionChecks: any;
  private supervisorList: any;
  private userList: any;

  public setOpfabInterface(opfabInterface: any) {
    this.opfabInterface = opfabInterface; 
    return this;
  }

  public setLogger(logger:any) {
    this.logger = logger;
    return this;
  }

  public setSecondsBetweenConnectionChecks(secondsBetweenConnectionChecks: any) {
   this.secondsBetweenConnectionChecks = secondsBetweenConnectionChecks;
   return this;
  }

  public setNbOfConsecutiveNotConnectedToSendFirstCard(nbOfConsecutiveNotConnectedToSendFirstCard: any) {
    this.nbOfConsecutiveNotConnectedToSendFirstCard = nbOfConsecutiveNotConnectedToSendFirstCard;
    this.minuteDisconnectedForFirstCard = (this.secondsBetweenConnectionChecks * this.nbOfConsecutiveNotConnectedToSendFirstCard) / 60;
    return this;
  }

  public setNbOfConsecutiveNotConnectedToSendSecondCard(nbOfConsecutiveNotConnectedToSendSecondCard:any) {
    this.nbOfConsecutiveNotConnectedToSendSecondCard = nbOfConsecutiveNotConnectedToSendSecondCard;
    this.minuteDisconnectedForSecondCard = (this.secondsBetweenConnectionChecks * nbOfConsecutiveNotConnectedToSendSecondCard) / 60;
    return this;
  }

  public setUsersToSupervise(usersToSupervise:any) {;
    this.supervisorList = new Map();
    this.userList = [];
    usersToSupervise.forEach((user:any) => {
      this.userList.push(user.login);
      this.supervisorList.set(user.login, user.supervisors);
    });
    this.userStates.setUsersToSupervise(this.userList);
    return this
  }

  public resetState() {
    this.userStates.reset();
  }

  public async checkConnection () {
    try {
        const users = await this.opfabInterface
            .getUsersConnected()
            .catch((e:any) => {this.logger.warn('Impossible to get user connected card ' + JSON.stringify(e));throw e});
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
