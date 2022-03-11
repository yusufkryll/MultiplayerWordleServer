const Network = require('./Network');
const crypto = require('crypto');


var port = process.env.PORT || 8080;
var network = new Network(port, {});


Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
  }


network.onConnect = (client, db) => {
    function TriggerUserRow(emitName, rowName)
    {
        client.on(emitName, async(data) => {
            const result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
            const result1 = result ? result.rows[0] : null;
            client.emit(emitName, result1[rowName]);
        });
    }
    console.log("A player connected: " + client.id); 
    client.on("GetUserData", async() => {
        const result = await db.query(`SELECT * FROM users WHERE public_id = '${client.data.public_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("GetUserData", result1);
    });
    client.on("GetArenas", async() => {
        const result = await db.query(`SELECT * FROM arenas`);
        const result1 = result ? result.rows : null;
        console.log(result1);
        client.emit("GetArenas", result1.toJSON());
    });
    client.on("get-id", async() => {
        const result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("get-id", result1.user_id);
    }) 
    client.on("get-public-id", async() => {
        const result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("get-public-id", result1.public_id);
    }) 
    client.on("AddFriend", async(data) => {
        const requestedUser = await db.query(`SELECT * FROM users WHERE public_id = '${data}'`);
        if(requestedUser == null || requestedUser.rows == null || requestedUser.rows[0] == null) {
            client.emit("AddFriend", false); 
        }
        else
        {
            var result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}' AND (friends @> ARRAY['${data}']::text[])`);
            const result1 = result ? result.rows[0] : null;
            if(result1) 
            {
                client.emit("AddFriend", false);
            }else{
                await db.query(`UPDATE users SET friendrequest = friendrequest || '{"${client.data.public_id}"}' WHERE public_id = '${data}'`);
                client.emit("AddFriend", true);
            }
        }
    }) 
    client.on("AcceptRequest", async(data) => {
        await db.query(`UPDATE users SET friendrequest = ARRAY_REMOVE(friendrequest, '${data}')  WHERE public_id = '${client.data.public_id}'`);
        await db.query(`UPDATE users SET friends = friends || '{"${data}"}' WHERE public_id = '${client.data.public_id}'`);
        await db.query(`UPDATE users SET friends = friends || '{"${client.data.public_id}"}' WHERE public_id = '${data}'`);
    }) 
    client.on("GetElement", async(data) => {
        const result = await db.query(`SELECT * FROM users WHERE public_id = '${client.data.public_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("GetElement-" + data, result1[data]);
    }) 
    client.on("get-name", async() => {
        const result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("get-name", result1.user_name);
    }) 
    client.on("refresh-coin", async() => {
        const result = await db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        if(result1 != null && result1.coin != null) client.emit("refresh-coin", result1.coin);
    });
    client.on("get-guest", async(data) => {
        client.data.user_id = data;
        const result = await 
        db.query(`SELECT * FROM users WHERE user_id = '${data}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("guest-status", result1 != null);
        if(result1 != null) 
        {
            client.data.user_name = result1.user_name;
            client.data.public_id = result1.public_id;
        }
    });
    client.on("GetFriends", async(data) => {
        const result = await 
        db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("GetFriends", result1.friends);
    });

    TriggerUserRow("GetRequests", "friendrequest");

    client.on("GiveFreeAward", async() => {
        const result = await 
        db.query(`SELECT * FROM users WHERE public_id = '${client.data.public_id}'`);
        const result1 = result ? result.rows[0] : null;
        if(new Date(result1.freeawardtime) < new Date())
        {
            await db.query(`UPDATE users SET freeawardtime = '${new Date().addHours(24).toJSON()}' WHERE public_id = '${client.data.public_id}'`);
            await db.query(`UPDATE users SET coin = coin + 250 WHERE public_id = '${client.data.public_id}'`);
            client.emit("GiveFreeAward", true);
        }
        else
        {
            client.emit("GiveFreeAward", false);
        }
    });



    client.on("guest-login", async (data) => {
        console.log(data.user_id);
        console.log(data.user_name);
        client.data.public_id = 
        crypto.randomBytes(6).toString("hex").match(/.{1,4}/g).join("-");
        var time = new Date().addHours(24).toJSON();
        const result = await 
        db.query(`INSERT INTO users (user_id, user_name, public_id, freeawardtime) VALUES ('${data.user_id}', '${data.user_name}', '${client.data.public_id}', '${time}')`);
        if(result != null) client.emit("guest-status", true);
        const result1 = result ? result.rows[0] : null;
        if(result1 != null) client.data.user_name = result1.user_name;
    });
    //const result = await db.query('SELECT * FROM test_table');
    //const results = { 'results': (result) ? result.rows : null};
};
