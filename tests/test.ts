import 'jest'
import sinon from 'sinon';
import UserStates from '../src/domain/application/userStates';
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

describe('Users state', function () {
    it('By default should return empty list when no user list to supervise ', function () {
        const toBeNotify = new UserStates();
        expect(toBeNotify.getUsersNotConnectedForConsecutiveTimes(1).length).toEqual(0);
    });

    it('Should return empty list when user list to supervise and no connection information ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(1).length).toEqual(0);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(2).length).toEqual(0);
    });

    it('By default should return empty list when user list to supervise and user connection ok  ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected(['user1', 'user2']);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(1).length).toEqual(0);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(2).length).toEqual(0);
    });

    it('Should return 2 user if 2 not connected once ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected([]);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(1).length).toEqual(2);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(2).length).toEqual(0);
    });

    it('Should return user not connected for x times  ', function () {
        const userStates = new UserStates();
        userStates.setUsersToSupervise(['user1', 'user2']);
        userStates.setUsersConnected([]);
        userStates.setUsersConnected(['user1']);
        userStates.setUsersConnected(['user1']);
        userStates.setUsersConnected([]);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(1)).toEqual(['user1']);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(2)).toEqual([]);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(3)).toEqual([]);
        expect(userStates.getUsersNotConnectedForConsecutiveTimes(4)).toEqual(['user2']);
    });
});