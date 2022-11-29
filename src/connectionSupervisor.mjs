/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import UserStates from "./userStates.mjs";
import OpfabInterface from "./opfabInterface.mjs";
import config from "config";
import logger from "./logger.mjs";
import express from "express";

const app = express();
const port = 3000;
let active = true;

app.get("/status", (req, res) => {
  res.send(active);
});

app.get("/start", (req, res) => {
  logger.info("Start supervisor asked");
  active = true;
  res.send("Start supervisor");
});

app.get("/stop", (req, res) => {
  logger.info("Stop supervisor asked");
  active = false;
  userStates.reset();
  res.send("Stop supervisor");
});

app.listen(port, () => {
  logger.info(`Opfab connection supervisor listening on port ${port}`);
});

const opfabInterface = new OpfabInterface()
  .setLogin(config.get("opfab.login"))
  .setPassword(config.get("opfab.password"))
  .setOpfabGetUsersConnectedUrl(config.get("opfab.consultationUrl"))
  .setOpfabPublicationUrl(config.get("opfab.publicationUrl"))
  .setOpfabGetTokenUrl(config.get("opfab.getTokenUrl"))
  .setCardTemplate(config.get("cardTemplate"));

const usersToSupervise = config.get("usersToSupervise");
const secondsBetweenConnectionChecks = config.get(
  "secondsBetweenConnectionChecks"
);
const nbOfDisconnectionToSendFirstCard = config.get(
  "nbOfDisconnectionToSendFirstCard"
);

const userStates = new UserStates();
userStates.setUsersToSupervise(usersToSupervise);

logger.info("Start");

checkRegulary();

async function checkRegulary() {
  if (active) {
    try {
      const users = await opfabInterface.getUsersConnected();
      logger.info("Users connected : " + users);
      userStates.setUsersConnected(users);
      const usersNotConnected =
        userStates.getUsersNotConnectedForConsecutiveTimes(
          nbOfDisconnectionToSendFirstCard
        );
      logger.info("Not connected = " + usersNotConnected);
      usersNotConnected.forEach(async (user) => {
        await opfabInterface.sendCard(user);
      });
    } catch (error) {
      console.log("Impossible to get users connected  , error =  ", error);
    }
  }
  setTimeout(() => checkRegulary(), secondsBetweenConnectionChecks);
}
