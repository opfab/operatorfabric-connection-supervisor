/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import axios from 'axios';
import {Logger} from 'winston';
import GetConnectedUsersResponse from './getConnectedUsersResponse';

export default class OpfabInterface {
    private token: string = '';
    private tokenAge: number = 0;
    private login: string = '';
    private password: string = '';
    private opfabGetUsersConnectedUrl: string = '';
    private opfabPublicationUrl: string = '';
    private opfabGetTokenUrl: string = '';
    private cardTemplate: any = '';
    private logger: any;

    public setLogin(login: string) {
        this.login = login;
        return this;
    }

    public setPassword(password: string) {
        this.password = password;
        return this;
    }

    public setOpfabGetTokenUrl(opfabGetTokenUrl: string) {
        this.opfabGetTokenUrl = opfabGetTokenUrl;
        return this;
    }

    public setOpfabGetUsersConnectedUrl(opfabGetUsersConnectedUrl: string) {
        this.opfabGetUsersConnectedUrl = opfabGetUsersConnectedUrl;
        return this;
    }

    public setOpfabPublicationUrl(opfabPublicationUrl: string) {
        this.opfabPublicationUrl = opfabPublicationUrl;
        return this;
    }

    public setCardTemplate(cardTemplate: any) {
        this.cardTemplate = cardTemplate;
        return this;
    }

    public setLogger(logger: any) {
        this.logger = logger;
        return this;
    }

    public async getUsersConnected(): Promise<GetConnectedUsersResponse> {
        try {
            await this.getToken();
            const response = await this.sendUsersConnectedRequest();
            const users = new Array();
            if (response?.data) {
                response.data.forEach((user: any) => {
                    users.push(user.login);
                });
                return new GetConnectedUsersResponse(users, true);
            }
            else {
                this.logger.warn("No data in HTTP response")
                return new GetConnectedUsersResponse(null, false);
            }
        } catch (e) {
            this.logger.warn('Impossible to get connected users', e);
            return new GetConnectedUsersResponse(null, false);
        }
       
    }

    private async getToken() {
        if (new Date().valueOf() - this.tokenAge < 60000) return;

        const response = await this.sendRequest({
            method: 'post',
            url: this.opfabGetTokenUrl,
            data: `username=${this.login}&password=${this.password}&grant_type=password&client_id=opfab-client`
        });
        this.token = response?.data?.access_token;
        if (!this.token) throw new Error('No token provided , http response = ' + response);
        this.tokenAge = new Date().valueOf();
    }

    public sendRequest(request: any) {
        return <Promise<any>>axios(request);
    }

    private sendUsersConnectedRequest() {
        return this.sendRequest({
            method: 'get',
            url: this.opfabGetUsersConnectedUrl,
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        });
    }

    public async sendCard(disconnectedUser: string, userRecipients: Array<string>, minutes: number) {
        try {
            await this.getToken();
            const card = Object.assign({}, this.cardTemplate);
            card.startDate = new Date().valueOf();
            card.processInstanceId = disconnectedUser;
            card.userRecipients = userRecipients;
            card.data = {user: disconnectedUser, minutes: minutes};
            card.title = {key: 'message.title', parameters: {user: disconnectedUser}};
            card.summary = {key: 'message.summary', parameters: {user: disconnectedUser, minutes: minutes}};
            const request = {
                method: 'post',
                url: this.opfabPublicationUrl,
                data: card,
                headers: {
                    Authorization: 'Bearer ' + this.token
                }
            };
            await this.sendRequest(request);
        } catch (exc) {
            this.logger.warn('Impossible to send card', exc);
        }
    }
}
