/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

export default class UserConnectionsStates {
    private consecutiveTimeUserNotConnected = new Map();
    private usersToSupervise = new Array();

    public setUsersToSupervise(users: any) {
        this.usersToSupervise = users;
        this.usersToSupervise.forEach((user) => this.consecutiveTimeUserNotConnected.set(user, 0));
    }

    public setUsersConnected(usersConnected: any) {
        this.usersToSupervise.forEach((user) => {
            if (usersConnected.includes(user)) this.consecutiveTimeUserNotConnected.set(user, 0);
            else {
                let nbDisconnect = this.consecutiveTimeUserNotConnected.get(user);
                this.consecutiveTimeUserNotConnected.set(user, nbDisconnect + 1);
            }
        });
    }

    public getUsersNotConnectedForConsecutiveTimes(times: any):Array<string> {
        const notConnected = new Array();
        for (const entry of this.consecutiveTimeUserNotConnected.entries()) {
            const user = entry[0];
            const nb = entry[1];
            if (nb === times) notConnected.push(user);
        }
        return notConnected;
    }

    public reset() {
        this.usersToSupervise.forEach((user) => this.consecutiveTimeUserNotConnected.set(user, 0));
    }
}
