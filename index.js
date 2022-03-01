const Network = require('./Network');
const crypto = require('crypto');

var port = process.env.PORT || 8080;
var network = new Network(port, {});


network.onConnect = (client, db) => {
    console.log("A player connected: " + client.id); 
    client.on("GetUserData", async(data) => {
        const result = await db.query(`SELECT * FROM users WHERE user_id = '${data}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("GetUserData", result1);
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
        if(requestedUser == null) {
            client.emit("AddFriend", false); 
            return;
        }
        const result = db.query(`UPDATE users SET friends = friends || '{"${data}"}'  WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("AddFriend", true); 
        
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
        if(result1 != null) client.data.user_name = result1.user_name;
    });
    client.on("GetFriends", async(data) => {
        const result = await 
        db.query(`SELECT * FROM users WHERE user_id = '${client.data.user_id}'`);
        const result1 = result ? result.rows[0] : null;
        console.table(result1.friends);
        client.emit("GetFriends", result1.friends);
    });
    client.on("guest-login", async (data) => {
        console.log(data.user_id);
        console.log(data.user_name);
        client.data.public_id = 
        crypto.randomBytes(6).toString("hex").match(/.{1,4}/g).join("-");
        const result = await 
        db.query(`INSERT INTO users (user_id, user_name, public_id) VALUES ('${data.user_id}', '${data.user_name}', '${client.data.public_id}')`);
        if(result != null) client.emit("guest-status", true);
        const result1 = result ? result.rows[0] : null;
        if(result1 != null) client.data.user_name = result1.user_name;
    });
    //const result = await db.query('SELECT * FROM test_table');
    //const results = { 'results': (result) ? result.rows : null};
};
