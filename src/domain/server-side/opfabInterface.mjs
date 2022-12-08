/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import axios from 'axios';

export default class OpfabInterface {
    #token = '';
    #tokenAge = 0;
    #login = '';
    #password = '';
    #opfabGetUsersConnectedUrl = '';
    #opfabPublicationUrl = '';
    #opfabGetTokenUrl = '';
    #cardTemplate = '';

    setLogin(login) {
        this.#login = login;
        return this;
    }

    setPassword(password) {
        this.#password = password;
        return this;
    }

    setOpfabGetTokenUrl(opfabGetTokenUrl) {
        this.#opfabGetTokenUrl = opfabGetTokenUrl;
        return this;
    }

    setOpfabGetUsersConnectedUrl(opfabGetUsersConnectedUrl) {
        this.#opfabGetUsersConnectedUrl = opfabGetUsersConnectedUrl;
        return this;
    }

    setOpfabPublicationUrl(opfabPublicationUrl) {
        this.#opfabPublicationUrl = opfabPublicationUrl;
        return this;
    }

    setCardTemplate(cardTemplate) {
        this.#cardTemplate = cardTemplate;
        return this;
    }

    async getUsersConnected() {
        await this.#getToken();
        const response = await this.#sendUsersConnectedRequest();
        const users = new Array();
        if (response?.data) {
            response.data.forEach((user) => {
                users.push(user.login);
            });
        }
        return users;
    }

    async #getToken() {
        if (new Date().valueOf() - this.#tokenAge < 60000) return;

        const response = await this.sendRequest({
            method: 'post',
            url: this.#opfabGetTokenUrl,
            data: `username=${this.#login}&password=${this.#password}&grant_type=password&client_id=opfab-client`
        });
        this.#token = response?.data?.access_token;
        if (!this.#token) throw new Error('No token provided , http response = ', response);
        this.#tokenAge = new Date().valueOf();
    }

    sendRequest(request) {
        return axios(request);
    }

    #sendUsersConnectedRequest() {
        return this.sendRequest({
            method: 'get',
            url: this.#opfabGetUsersConnectedUrl,
            headers: {
                Authorization: 'Bearer ' + this.#token
            }
        });
    }

    async sendCard(disconnectedUser, userRecipients, minutes) {
        await this.#getToken();
        const card = Object.assign({}, this.#cardTemplate);
        card.startDate = new Date().valueOf();
        card.processInstanceId = disconnectedUser;
        card.userRecipients = userRecipients;
        card.data = {user: disconnectedUser, minutes: minutes};
        card.title = {key: 'message.title', parameters: {user: disconnectedUser}};
        card.summary = {key: 'message.summary', parameters: {user: disconnectedUser, minutes: minutes}};
        const request = {
            method: 'post',
            url: this.#opfabPublicationUrl,
            data: card,
            headers: {
                Authorization: 'Bearer ' + this.#token
            }
        };
        return this.sendRequest(request);
    }
}
