module.exports = class Network
{
    constructor(port)
    {
        this.randomElement = function (arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
        this.onConnect = (client, db) => { console.log("Connection successfully!") };
        this.Start(port);
        
    }
    Start = (port) =>
    {
        try
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
                client.log = (message) => client.emit("debug-log", message); 
                pool.connect((err, db) => {
                    this.onConnect(client, db);
                });
                client.on('RunAll', (data) => {
                    console.log(data);
                    this.io.emit('RunAll', data);
                });
                client.on("SearchGame", async (data) => {
                    var getInPool = async() => await this.io.in("pool").fetchSockets();
                    if(Object.keys(await getInPool()).length <= 0)
                    {
                        console.log("No players found.");
                        client.join("pool");
                        console.log(await getInPool());
                    }
                    else
                    {
                        console.log("There is players in pool.");
                        var inPool = await getInPool();
                        var otherPlayer = this.randomElement(inPool);
                        console.log(otherPlayer.id);
                        let roomName = client.id + "-room";
                        client.join(roomName);
                        console.log(roomName);
                        
                        client.emit("GameFound", otherPlayer);
                        this.io.to(otherPlayer).emit("GameFound", client.id);
                    }
                    
                });
                client.on('disconnect', reason => {
                    console.log(`reason: ${reason}`);
                });
        });
        }
        catch (err)
        {
            console.log(err);
        }
    }
    Listen = () =>
    {
        this.server.listen(this.port, () => {
            console.log('listening on *:' + this.port);
        });
    }

    
}