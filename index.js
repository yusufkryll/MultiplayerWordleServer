const Network = require('./Network');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

network.data = {

};

network.onConnect = client => {

};

network.onRoomStarted = room => {

};

network.onGameStarted = room => {

};
