module.exports = class Network
{
    constructor(port)
    {
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
            client.log = (message) => client.emit("debug-log", message); 
            pool.connect((err, db) => {
              this.onConnect(client, db);
            });
            client.on('RunAll', (data) => {
                console.log(data);
                this.io.emit('RunAll', data);
            });
            client.on("SearchGame", data => {
                client.join("pool");
                console.log(client.rooms);
                client.log(client.rooms);
            })
        });
    }
    Listen = () =>
    {
        this.server.listen(this.port, () => {
            console.log('listening on *:' + this.port);
        });
    }
}