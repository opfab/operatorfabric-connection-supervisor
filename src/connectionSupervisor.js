const UserStates = require('./userStates');
const OpfabInterface = require('./opfabInterface');
const config = require('config');

const opfabInterface = (new OpfabInterface())
    .setLogin(config.get('opfab.login'))
    .setPassword(config.get('opfab.password'))
    .setOpfabGetUsersConnectedUrl(config.get('opfab.consultationUrl'))
    .setOpfabPublicationUrl(config.get('opfab.publicationUrl'))
    .setOpfabGetTokenUrl(config.get('opfab.getTokenUrl'));

const usersToSupervise = config.get('usersToSupervise');
const secondsBetweenConnectionChecks = config.get('secondsBetweenConnectionChecks');
const userStates = new UserStates();
userStates.setUsersToSupervise(usersToSupervise);

checkRegulary();

async function checkRegulary() {
    try {
        const users = await opfabInterface.getUsersConnected();
        console.log('Users connected : ', users);
        userStates.setUsersConnected(users);
        console.log('Not connected = ', userStates.getUsersNotConnectedForConsecutiveTimes(3));
    } catch (error) {
        console.log('Impossible to get users connected  , error =  ', error);
    }

    setTimeout(() => checkRegulary(), secondsBetweenConnectionChecks);
}
