/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import config from 'config';

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transport = new DailyRotateFile({
  filename: <any> config.get("logConfig.logFolder") + config.get("logConfig.logFile"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: config.get("logConfig.logLevel"),
});

transport.on("rotate", function (oldFilename, newFilename) {
  // call function like upload to s3 or on cloud
});


const logger = winston.createLogger({
  format: logFormat,
  transports: [transport],
});

export default logger;


