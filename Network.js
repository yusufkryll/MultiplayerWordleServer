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
        const { instrument } = require("@socket.io/admin-ui");
        const app = express();
        const tr = new (require('./wordgenerator'))("tr", () => {});
        const en = new (require('./wordgenerator'))("en", () => {});



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
        instrument(this.io, {
            auth: {
                type: "basic",
                username: "admin",
                password: "$2b$10$eridLObZqZm1Hu0.ab1fvORb1bwm9MKZZ3YqvvWdj2Cb8Nkhwimqi" //msw1232
              },
        });
        this.port = port;
        this.Listen();
        this.io.of("/").adapter.on("leave-room", (room, id) => {
            this.io.to(room).emit("player-leaved");
            this.io.in(room).socketsLeave(room);
        });
        this.io.on('connect', (client) => {
                client.data.language = "turkish";
                var otherPlayer = null;
                var db = null;
                client.log = (message) => client.emit("debug-log", message); 
                pool.connect((err, database) => {
                    this.onConnect(client, database);
                    db = database;
                });
                client.on('RunAll', (data) => {
                    this.io.emit('RunAll', data);
                });
                client.on("OtherPlayer", async(data) => {
                    var sockets = await this.io.in(data).fetchSockets();
                    otherPlayer = sockets[0];
                });
                client.on("emit-other", (data) => {
                    otherPlayer.emit(data.name, data.data);
                });

                client.on("send-message", (data) => {
                    console.log(data);
                    this.io.to(client.data.gameRoom).emit("send-message", data);
                })


                client.on("SearchGame", async (data) => {
                    client.data.language = data.language;
                    var getInPool = async() => {
                        var all = await this.io.in("pool").fetchSockets();
                        var selected = [];
                        all.forEach(s => {
                            if(s.data.language == client.data.language) selected.push(s);
                        });
                        return selected;
                    };
                    if(Object.keys(await getInPool()).length <= 0)
                    {
                        client.join("pool");
                    }
                    else
                    {
                        var inPool = await getInPool();
                        otherPlayer = this.randomElement(inPool);
                        let roomName = client.id + "-room";
                        client.join(roomName);
                        client.data.gameRoom = roomName;
                        otherPlayer.data.gameRoom = roomName;
                        otherPlayer.leave("pool");
                        otherPlayer.join(roomName);
                        client.emit("GameFound", otherPlayer.data.user_name);
                        otherPlayer.emit("GameFound", client.data.user_name);
                        otherPlayer.emit("OtherPlayer", client.id);
                        gameAction(client, otherPlayer, roomName, db);
                    }
                    
                });
                client.on('disconnect', reason => {
                    console.log(`reason: ${reason}`);
                });
        });

        function gameAction(client, otherPlayer, roomName, db)
        {
            var word = tr.GetRandomWord();
            var wordLine = 0;
            var turn = true;
            var time = 60;
            var lastFounded = [null, null, null, null, null];
            function applyTurn()
            {
                time = 60;
                client.emit("set-turn", turn);
                otherPlayer.emit("set-turn", !turn);
                client.emit("turn-time", time);
                otherPlayer.emit("turn-time", time);
            }
            applyTurn();
            setInterval(function() {
                time -= 1;
                if(time <= 0)
                {
                    time = 60;
                    turn = !turn;
                    client.emit("time-up", turn);
                    otherPlayer.emit("time-up", !turn);
                }
                else
                {
                    client.emit("turn-time", time);
                    otherPlayer.emit("turn-time", time);
                }
            }, 1000);
            twiceOn(client, otherPlayer, "word-end", (who, other, data) => {
                var founded = [null, null, null, null, null];
                console.log(word);
                console.log(data);
                if(word == data)
                {
                    Win(who);
                    Lose(other);
                }
                else
                {
                    wordLine++;
                }
                function inclf(str, d, queue)
                {

                    for(let i in founded)
                    {
                        let f = founded[i];
                        console.log(f);
                        if(f != d[queue] && str[i] == d[queue]) return true;
                    }
                    return false;
                }

                function GetCorrection(w, d, queue) {
                    if(d[queue] == w[queue]) {
                        founded[queue] = w[queue];
                        return "correct";
                    }
                    else if(inclf(w, d, queue)) return "available";
                    return "incorrect";
                }
                GetCorrection(word, data, 0);
                GetCorrection(word, data, 1);
                GetCorrection(word, data, 2);
                GetCorrection(word, data, 3);
                GetCorrection(word, data, 4);
                function anyFounded()
                {
                    for(let i in founded)
                    {
                        var f = founded[i];
                        if(f != null && lastFounded[i] == null) 
                        {
                            lastFounded[i] = f;
                            return true;
                        }
                    }
                    return false;
                }
                if(!anyFounded())
                {
                    turn = !turn;
                    applyTurn();
                }
                else
                {
                    applyTurn();
                }
                console.log(lastFounded);
                var res = {
                    line: wordLine,
                    l1: GetCorrection(word, data, 0),
                    l2: GetCorrection(word, data, 1),
                    l3: GetCorrection(word, data, 2),
                    l4: GetCorrection(word, data, 3),
                    l5: GetCorrection(word, data, 4),
                };
                who.emit("word-end", res);
                other.emit("word-end", res);
            });
            async function Win(who)
            {
                who.emit("win");
                var q = await db.query(`UPDATE users SET coin = coin + 500 WHERE user_id = '${who.data.user_id}'`);
                const resultu = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
                const result1 = resultu ? resultu.rows[0] : null;
                client.emit("refresh-coin", result1.coin);
            }
    
            async function Lose(who)
            {
                who.emit("lose");
                var q = await db.query(`UPDATE users SET coin = coin - 500 WHERE user_id = '${who.data.user_id}'`);
                const resultu = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
                const result1 = resultu ? resultu.rows[0] : null;
                client.emit("refresh-coin", result1.coin);
            }
        }

        function twiceOn(c1, c2, n, action)
        {
            c1.on(n, (data) => action(c1, c2, data));
            c2.on(n, (data) => action(c2, c1, data));
        }



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