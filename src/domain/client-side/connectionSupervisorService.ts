import ConnectionChecker from "../application/connectionChecker"

export default class ConnectionSupervisorService {

    private connectionChecker:ConnectionChecker;
    private secondsBetweenConnectionChecks: number;
    private active = false;


    constructor(config:any,opfabInterface:any, logger:any ) {

    this.secondsBetweenConnectionChecks = config.secondsBetweenConnectionChecks;

    this.connectionChecker = new ConnectionChecker()
        .setLogger(logger)
        .setOpfabInterface(opfabInterface)
        .setSecondsBetweenConnectionChecks(config.secondsBetweenConnectionChecks)
        .setNbOfConsecutiveNotConnectedToSendFirstCard(config.nbOfConsecutiveNotConnectedToSendFirstCard)
        .setNbOfConsecutiveNotConnectedToSendSecondCard(config.nbOfConsecutiveNotConnectedToSendSecondCard)
        .setUsersToSupervise(config.usersToSupervise)

    this.checkRegularly();
    }


    public start() {
        this.active = true;
    } 

    public stop()  {
        this.active = false;
        this.connectionChecker.resetState();
    }

    private async checkRegularly() {
        if (this.active) {
            this.connectionChecker.checkConnection();      
        }
        setTimeout(() => this.checkRegularly(), this.secondsBetweenConnectionChecks * 1000);
    }
     
}
