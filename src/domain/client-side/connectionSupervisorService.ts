/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import ConnectionChecker from '../application/connectionChecker';
import OpfabInterface from '../server-side/opfabInterface';
import ConfigDTO from './configDTO';

export default class ConnectionSupervisorService {
    private connectionChecker: ConnectionChecker;
    private secondsBetweenConnectionChecks: number;
    private active = false;

    constructor(config: ConfigDTO, opfabInterface: OpfabInterface, logger: any) {
        this.secondsBetweenConnectionChecks = config.secondsBetweenConnectionChecks;

        this.connectionChecker = new ConnectionChecker()
            .setLogger(logger)
            .setOpfabInterface(opfabInterface)
            .setSecondsBetweenConnectionChecks(config.secondsBetweenConnectionChecks)
            .setNbOfConsecutiveNotConnectedToSendFirstCard(config.nbOfConsecutiveNotConnectedToSendFirstCard)
            .setNbOfConsecutiveNotConnectedToSendSecondCard(config.nbOfConsecutiveNotConnectedToSendSecondCard)
            .setUsersToSupervise(config.usersToSupervise);

        this.checkRegularly();
    }

    public start() {
        this.active = true;
    }

    public stop() {
        this.active = false;
        this.connectionChecker.resetState();
    }

    private async checkRegularly() {
        if (this.active) {
            this.connectionChecker.checkConnection();
        }
        setTimeout(() => this.checkRegularly(), this.secondsBetweenConnectionChecks * 1000);
    }
}
