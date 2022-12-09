import 'jest'
import sinon from 'sinon';
import OpfabInterface from '../src/domain/server-side/opfabInterface';


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
        expect(users).toEqual(['user1']);
    });


    it('Should throw exception when impossible to authenticate to opfab ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request:any) => {
            return Promise.reject('test');
        });
        try {
            await opfabInterface.getUsersConnected();
            // error case 
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual('test');
        }
    });
    
    it('Should throw exception when error in user request ', async function () {
        const opfabInterface = getOpfabInterface();
        sinon.stub(opfabInterface, 'sendRequest').callsFake((request) => {
            if (request.url.includes('token')) return Promise.resolve({status: 200, data: {access_token: 'fakeToken'}});
            else return Promise.reject("error message");
        });
        try {
            await opfabInterface.getUsersConnected();
            expect(true).toEqual(false);
        } catch (error) {
           expect(error).toEqual("error message");
        }
    });
}); 
