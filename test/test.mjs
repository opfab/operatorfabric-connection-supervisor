/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import assert from 'node:assert';
import sinon from 'sinon'
import OpfabInterface from  '../src/opfabInterface.mjs';
import UserStates from '../src/userStates.mjs';

function getOpfabInterface() {
    return new OpfabInterface()
        .setLogin('test')
        .setPassword('test')
        .setOpfabGetTokenUrl('tokenurl')
        .setOpfabGetUsersConnectedUrl('test')
        .setOpfabPublicationUrl('test');
}

describe('Opfab interface', function () {
    it('Should get one user login when one user connected ', async function () {
        const opfabInterface = getOpfabInterface();

        sinon.stub(opfabInterface, 'sendRequest').callsFake((request) => {
            if (request.url.includes('token')) return Promise.resolve({status: 200, data: {access_token: 'fakeToken'}});
            else {
                if (request.headers?.Authorization?.includes('Bearer fakeToken'))
                    return Promise.resolve({status: 200, data: [{login: 'user1'}]});
                else return Promise.resolve({status: 400});
            }
        });
        const users = await opfabInterface.getUsersConnected();
        assert.deepEqual(users, ['user1']);
    });

    it('Should throw exception when impossible to authenticate to opfab ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request) => {
            if (request.url.includes('token')) Promise.reject('test');
            else {
                if (request.headers?.Authorization?.includes('Bearer fakeToken'))
                    return Promise.resolve({status: 200, data: [{login: 'user1'}]});
                else return Promise.resolve({status: 400});
            }
        });
        try {
            await opfabInterface.getUsersConnected();
            assert.equal(true, false);
        } catch (error) {
            assert.equal(error.message, 'Impossible to get user connected list');
        }
    });

    it('Should throw exception when error in user request ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request) => {
            if (request.url.includes('token')) return Promise.resolve({status: 200, data: {access_token: 'fakeToken'}});
            else Promise.resolve({status: 400});
        });
        try {
            await opfabInterface.getUsersConnected();
            assert.equal(true, false);
        } catch (error) {
            assert.equal(error.message, 'Impossible to get user connected list');
        }
    });
});

describe('Users state', function () {
    it('By default should return empty list when no user list to supervise ', function () {
        const toBeNotify = new UserStates();
        assert.equal(toBeNotify.getUsersNotConnectedForConsecutiveTimes().length, 0);
    });

    it('Should return empty list when user list to supervise and no connection information ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(1).length, 0);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(2).length, 0);
    });

    it('By default should return empty list when user list to supervise and user connection ok  ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected(['user1', 'user2']);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(1).length, 0);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(2).length, 0);
    });

    it('Should return 2 user if 2 not connected once ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected([]);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(1).length, 2);
        assert.equal(userStates.getUsersNotConnectedForConsecutiveTimes(2).length, 0);
    });

    it('Should return user not connected for x times  ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected([]);
        userStates.setUsersConnected(['user1']);
        userStates.setUsersConnected(['user1']);
        userStates.setUsersConnected([]);
        assert.deepEqual(userStates.getUsersNotConnectedForConsecutiveTimes(1), ['user1']);
        assert.deepEqual(userStates.getUsersNotConnectedForConsecutiveTimes(2), []);
        assert.deepEqual(userStates.getUsersNotConnectedForConsecutiveTimes(3), []);
        assert.deepEqual(userStates.getUsersNotConnectedForConsecutiveTimes(4), ['user2']);
    });
});
