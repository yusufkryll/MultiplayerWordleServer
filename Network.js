module.exports = class Network
{
    constructor(port)
    {
        this.randomElement = function (obj) {
            var keys = Object.keys(obj);
            return keys[ keys.length * Math.random() << 0];
        }
        this.onConnect = (client, db) => { console.log("Connection successfully!") };
        this.Start(port);
        
    }
    Start = (port) =>
    {
        const http = require('http');
        const express = require('express');
        const socketIo = require('socket.io');
        const { Pool } = require('pg');
        const app = express();

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false
            }
          });
          
        app.get('/', function(req, res) {
            res.send("<h1 style = 'color:red;'>No Page</h1>");
        })
        this.server = http.createServer(app);
        this.io = socketIo(this.server, { 
            transports: ['websocket'],
            pingInterval: 1000 * 60 * 5,
            pingTimeout: 1000 * 60 * 3
        });
        this.port = port;
        this.Listen();
        var that = this;
        this.io.on('connect', (client) => {
            try
            {
                let getInPool = () => {
                    var poolRoom = that.io.sockets.adapter.rooms['pool'];
                    if(poolRoom != undefined) return poolRoom.sockets;
                    else return {};
                };
                client.log = (message) => client.emit("debug-log", message); 
                pool.connect((err, db) => {
                  this.onConnect(client, db);
                });
                client.on('RunAll', (data) => {
                    console.log(data);
                    this.io.emit('RunAll', data);
                });
                client.on("SearchGame", data => {
                    if(Object.keys(getInPool()).length <= 0)
                    {
                        console.log("No players found.");
                        client.join("pool");
                    }
                    else
                    {
                        console.log("There is players in pool.");
                        var otherPlayer = this.randomElement(getInPool());
                        console.log(otherPlayer);
                        let roomName = client.id + "-room";
                        client.join(roomName);
                        console.log(roomName);
                        //this.io.to(otherPlayer).join(roomName);
                        client.emit("GameFound", otherPlayer);
                        this.io.to(otherPlayer).emit("GameFound", client.id);
                    }
                    console.log(getInPool());
                })
            }
            catch (err)
            {
                console.log(err);
            }
        });
    }
    Listen = () =>
    {
        this.server.listen(this.port, () => {
            console.log('listening on *:' + this.port);
        });
    }
}