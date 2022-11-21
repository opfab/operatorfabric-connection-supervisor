module.exports = function () {


  this.consecutiveTimeUserNotConnected = new Map();
  this.usersToSupervise = new Array();


  this.setUsersToSupervise = function(users) {
    this.usersToSupervise = users;    
    this.usersToSupervise.forEach ( (user) => this.consecutiveTimeUserNotConnected.set(user,0));
  }

  this.setUsersConnected = function (usersConnected) {
    this.usersToSupervise.forEach( user => {
      if (usersConnected.includes(user)) this.consecutiveTimeUserNotConnected.set(user,0);
      else {
        let nbDisconnect = this.consecutiveTimeUserNotConnected.get(user); 
        this.consecutiveTimeUserNotConnected.set(user,nbDisconnect+1);
      }
    });
  }

  this.getUsersNotConnectedForConsecutiveTimes= function(times) {
    const notConnected  = new Array();
    for (const entry of this.consecutiveTimeUserNotConnected.entries()) {
      const user = entry[0];
      const nb = entry[1];
      if (nb ===  times) notConnected.push(user)
    }
    return notConnected;
  }
}
