const Network = require('./Network');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

network.onConnect = client => {
    console.log("A player connected: " + client.id);  
};

module.exports = network.router;
