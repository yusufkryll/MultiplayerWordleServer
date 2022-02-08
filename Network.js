module.exports = class Network
{
    constructor(port, events)
    {
        const Rooms = require('./Rooms');
        this.events = events;
        this.rooms = new Rooms(this);
        this.data = {};
        this.onConnect = () => { console.log("Connection successfully!") };
        this.onRoomStarted = () => { console.log("Room started successfully!") };
        this.onGameStarted = () => { console.log("Game started successfully!") };
        this.Start(port);
        this.WhenConnect(this.ConnectEvent);
        
    }
    ConnectEvent = (client) =>
    {
        client.when = (name, callback) => {
            client.on(name, callback);
        };
        client.send = (name, data = null, type = 0) => {
            setTimeout(() => {
                switch (type) {
                  case 0:
                    client.emit(name, data);
                    break;
                  case 1:
                    this.io.to("0").emit(name, data);
                    break;
                  default:
                    break;
                }
            }, 1);
        };
        this.onConnect(client);
    }
    WhenConnect = (callback) =>
    {
        this.io.on('connect', (client) => {
            callback(client);
            this.SetEvents(client);
        });
    }
    Start = (port) =>
    {
        const http = require('http');
        const express = require('express');
        const socketIo = require('socket.io');
        const app = express();
        this.server = http.createServer(app);
        this.io = socketIo(this.server);
        this.port = port;
        this.Listen();
    }
    Listen = () =>
    {
        this.server.listen(this.port, () => {
            console.log('listening on *:' + this.port);
        });
    }
    SetEvents = (client) =>
    {
        var defaultEvents = {
            disconnect: data => {
                console.log('a user disconnected.');
                delete this.rooms[client.roomNumber];
            },
            getData: data => {
                var newData = {...{name: data.name},...this.data[data.name]};
                client.send("getData", newData);
            },
            gameStarted: data => {
                this.onGameStarted(this.rooms[client.roomNumber]);
            },
            'status-ping': data => {
                client.send('status-pong', data);
            },
            searchGame: data => {
                if(data == "transport close") return;
                if(data == undefined) return;
                this.rooms.JoinRandom(client);
            },
            Move: data => {
                client.send("Move", data, 1);
            },
            Instantiate: data => {
                client.send("Instantiate", data, 1);
            },
        };
        this.events = {...this.events, ...defaultEvents};
        for (var name in this.events) {
            var callback = this.events[name];
            if(typeof callback === "function")
            {
                client.on(name, this.events[name]);
              continue;
            }
            client.when(name, data => {
                client.send(name, data, 1);
            });
        }
    }
}