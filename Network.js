module.exports = class Network
{
    constructor(port)
    {
        this.randomElement = function (arr) {
            return this[Math.floor((Math.random()*this.length))];
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
        this.io = socketIo(this.server);
        this.port = port;
        this.Listen();
        this.io.on('connect', (client) => {
            try
            {
                client.log = (message) => client.emit("debug-log", message); 
                pool.connect((err, db) => {
                  this.onConnect(client, db);
                });
                client.on('RunAll', (data) => {
                    console.log(data);
                    this.io.emit('RunAll', data);
                });
                client.on("SearchGame", data => {
                    let getInPool = () => {
                        var poolRoom = this.io.sockets.adapter.rooms['pool'];
                        if(poolRoom != undefined) return poolRoom.sockets;
                        else return {};
                    };

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

                        //this.io.to(otherPlayer).join(roomName);
                        this.io.to(otherPlayer).emit("GameFound", client.id);
                        client.emit("GameFound", otherPlayer);
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