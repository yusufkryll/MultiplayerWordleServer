module.exports = class Network
{
    constructor(port)
    {
        this.onConnect = () => { console.log("Connection successfully!") };
        this.Start(port);
        
    }
    Start = (port) =>
    {
        const http = require('http');
        const express = require('express');
        const socketIo = require('socket.io');
        const app = express();
        express.Router().get('/db', async (req, res) => {
            try {
              const client = await pool.connect();
              const result = await client.query('SELECT * FROM test_table');
              const results = { 'results': (result) ? result.rows : null};
              res.render('pages/db', results );
              client.release();
            } catch (err) {
              console.error(err);
              res.send("Error " + err);
            }
          });
        this.server = http.createServer(app);
        this.io = socketIo(this.server);
        this.port = port;
        this.Listen();
        this.io.on('connect', (client) => {
            this.onConnect(client);
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