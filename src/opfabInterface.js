const axios = require('axios');

module.exports = function () {
    this.token = '';
    this.tokenAge = 0;
    this.login = "";
    this.password = "";
    this.opfabGetUsersConnectedUrl = "";
    this.opfabPublicationUrl = "";
    this.opfabGetTokenUrl = "";

    this.setLogin = function(login) {
        this.login = login;
        return this;
    }

    this.setPassword = function(password) {
        this.password = password;
        return this;
    }

    this.setOpfabGetTokenUrl = function(opfabGetTokenUrl) {
        this.opfabGetTokenUrl = opfabGetTokenUrl;
        return this;
    }


    this.setOpfabGetUsersConnectedUrl = function(opfabGetUsersConnectedUrl) {
        this.opfabGetUsersConnectedUrl = opfabGetUsersConnectedUrl;
        return this;
    }

    this.setOpfabPublicationUrl = function(opfabPublicationUrl) {
        this.opfabPublicationUrl = opfabPublicationUrl;
        return this;
    }


    this.getUsersConnected = async function () {
        try {
            await this.getToken();
            const response = await this.sendUsersConnectedRequest();
            const users = new Array();
            if (response.data) {
                response.data.forEach((user) => {
                    users.push(user.login);
                });
                return users;
            }
        } catch (exception) {
            console.log(exception);
            throw new Error('Impossible to get user connected list');
        }
    };

    this.postNotification = function (users) {};

    this.getToken = async function () {
        if (new Date().valueOf() - this.tokenAge < 60000) return;

        const response = await this.sendRequest({
            method: 'post',
            url: this.opfabGetTokenUrl,
            data: `username=${this.login}&password=${this.password}&grant_type=password&client_id=opfab-client`
        });
        this.token = response?.data?.access_token;
        if (!this.token) throw new Error("No token provided , http response = ", response )
        this.tokenAge = new Date().valueOf();
    };

    this.sendUsersConnectedRequest = function () {
        return this.sendRequest({
            method: 'get',
            url: this.opfabGetUsersConnectedUrl,
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        });
    };

    this.sendRequest = function (request) {
        return axios(request);
    };
};
