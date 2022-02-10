module.exports = class Network
{
    constructor(port)
    {
        this.onConnect = async(client, db) => { console.log("Connection successfully!") };
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
        this.io.on('connect', async (client) => {
            try {
              const db = await pool.connect();
              await this.onConnect(client, db);
            } catch (err) {
              console.error(err);
            }
            client.on('RunAll', (data) => {
                console.log(data);
                this.io.emit('RunAll', data);
            });
        });
    }
    Listen = () =>
    {
        this.server.listen(this.port, () => {
            console.log('listening on *:' + this.port);
        });
    }
}