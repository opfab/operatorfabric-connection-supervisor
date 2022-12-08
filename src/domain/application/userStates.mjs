
/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

export default class UserStates {
  
  #consecutiveTimeUserNotConnected = new Map();
  #usersToSupervise = new Array();

  setUsersToSupervise(users) {
    this.#usersToSupervise = users;
    this.#usersToSupervise.forEach((user) =>
      this.#consecutiveTimeUserNotConnected.set(user, 0)
    );
  }

  setUsersConnected(usersConnected) {
    this.#usersToSupervise.forEach((user) => {
      if (usersConnected.includes(user))
        this.#consecutiveTimeUserNotConnected.set(user, 0);
      else {
        let nbDisconnect = this.#consecutiveTimeUserNotConnected.get(user);
        this.#consecutiveTimeUserNotConnected.set(user, nbDisconnect + 1);
      }
    });
  }

  getUsersNotConnectedForConsecutiveTimes(times) {
    const notConnected = new Array();
    for (const entry of this.#consecutiveTimeUserNotConnected.entries()) {
      const user = entry[0];
      const nb = entry[1];
      if (nb === times) notConnected.push(user);
    }
    return notConnected;
  }

  reset() {
    this.#usersToSupervise.forEach((user) =>
      this.#consecutiveTimeUserNotConnected.set(user, 0)
    );
  }
}
