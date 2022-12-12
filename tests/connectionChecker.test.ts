import 'jest'
import OpfabInterface from '../src/domain/server-side/opfabInterface';
import ConnectionChecker from '../src/domain/application/connectionChecker'
import logger from '../src/domain/server-side/logger';
import GetConnectedUsersResponse from '../src/domain/server-side/getConnectedUsersResponse';



class OpfabInterfaceStub extends OpfabInterface {

public disconnectedUser:string ;
public userRecipients: Array<string> = new Array();
public minutes: number = 0;
public numberOfCardSend =0;
public isResponseValid = true;

public userConnected: Array<string> = new Array();

async getUsersConnected() {
        return new GetConnectedUsersResponse(this.userConnected,this.isResponseValid);
    }

async sendCard(disconnectedUser:string, userRecipients:Array<string>, minutes:number) {
    
    this.numberOfCardSend++;
    this.disconnectedUser = disconnectedUser;
    this.userRecipients =userRecipients;
    this.minutes = minutes;
}

}

describe('connection checker', function () {

    let connectionChecker : ConnectionChecker;
    let opfabInterfaceStub : OpfabInterfaceStub;

    beforeEach(() => {
        opfabInterfaceStub = new OpfabInterfaceStub();
        opfabInterfaceStub.userConnected = ["user3"];
        connectionChecker = new ConnectionChecker()
        .setLogger(logger)
        .setOpfabInterface(opfabInterfaceStub)
        .setSecondsBetweenConnectionChecks(120)
        .setNbOfConsecutiveNotConnectedToSendFirstCard(3)
        .setNbOfConsecutiveNotConnectedToSendSecondCard(5)
        .setUsersToSupervise([,{login:"user1",supervisors:["user2"]},{login:"user3",supervisors:["user2"]}]);

    })
    it ('Should send a card after 3 times disconnected user 1' , async function() {
       
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        expect(opfabInterfaceStub.disconnectedUser).toEqual("user1");
        expect(opfabInterfaceStub.userRecipients).toEqual(["user2"]);
        expect(opfabInterfaceStub.minutes).toEqual(6);

    });

    it ('Should send a second card after 5 times disconnected user 1' , async function() {

        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(2);
        expect(opfabInterfaceStub.disconnectedUser).toEqual("user1");
        expect(opfabInterfaceStub.userRecipients).toEqual(["user2"]);
        expect(opfabInterfaceStub.minutes).toEqual(10);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(2);
    });


    it ('Do not send card if user1 connected ' , async function() {
        opfabInterfaceStub.userConnected = ["user1","user3"];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);

    });

    it ('Do not send card if user1 disconnected only two times ' , async function() {

        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        opfabInterfaceStub.userConnected = ["user1","user3"];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);

    });

    it ('Send card if user connected 2 times and after disconnected 3 times ' , async function() {

        opfabInterfaceStub.userConnected = ["user1","user3"];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        opfabInterfaceStub.userConnected = ["user3"];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);

    });

    it ('Send no send second card if user connect after first card ' , async function() {

        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        opfabInterfaceStub.userConnected = ["user1","user3"];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);

    });

    it ('Should send 2 card if 2 user disconnected' , async function() {

        opfabInterfaceStub.userConnected = [];
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(2);
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(4);

    });


    it ('Should restart from zero if reset connection checker' , async function() {

        await connectionChecker.checkConnection();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        connectionChecker.resetState();
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(2);
        expect(opfabInterfaceStub.disconnectedUser).toEqual("user1");
        expect(opfabInterfaceStub.userRecipients).toEqual(["user2"]);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(2);
    });

    it ('Should send a card after 3 times disconnected user1 with 2 error in get user connected ' , async function() {
       
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        opfabInterfaceStub.isResponseValid = false;
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        opfabInterfaceStub.isResponseValid = true;
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(0);
        await connectionChecker.checkConnection();
        expect(opfabInterfaceStub.numberOfCardSend).toEqual(1);
        expect(opfabInterfaceStub.disconnectedUser).toEqual("user1");
        expect(opfabInterfaceStub.userRecipients).toEqual(["user2"]);
        expect(opfabInterfaceStub.minutes).toEqual(6);

    });

})
