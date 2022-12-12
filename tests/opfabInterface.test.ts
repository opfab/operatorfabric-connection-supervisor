import 'jest';
import sinon from 'sinon';
import GetConnectedUsersResponse from '../src/domain/server-side/getConnectedUsersResponse';
import OpfabInterface from '../src/domain/server-side/opfabInterface';
import logger from '../src/domain/server-side/logger';

function getOpfabInterface() {
    return new OpfabInterface()
        .setLogin('test')
        .setPassword('test')
        .setOpfabGetTokenUrl('tokenurl')
        .setOpfabGetUsersConnectedUrl('test')
        .setOpfabPublicationUrl('test')
        .setLogger(logger);
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
        expect(users).toEqual(new GetConnectedUsersResponse(['user1'], true));
    });

    it('Should return invalid reponse  when impossible to authenticate to opfab ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request: any) => {
            return Promise.reject('test');
        });
        const getConnectedUsersResponse = await opfabInterface.getUsersConnected();
        expect(getConnectedUsersResponse.isValid()).toBe(false);
    });

    it('Should return invalid reponse  when error in user request ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request) => {
            if (request.url.includes('token')) return Promise.resolve({status: 200, data: {access_token: 'fakeToken'}});
            else return Promise.reject('error message');
        });
        const getConnectedUsersResponse = await opfabInterface.getUsersConnected();
        expect(getConnectedUsersResponse.isValid()).toBe(false);
    });
});
