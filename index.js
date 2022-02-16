const Network = require('./Network');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

network.onConnect = async (client, db) => {
    console.log("A player connected: " + client.id);  
    client.on("get-guest", async(data) => {
        const result = await 
        db.query(`SELECT * FROM users WHERE user_id = '${data}'`);
        const result1 = result ? result.rows[0] : null;
        client.emit("guest-status", result1 != null);
    });
    client.on("guest-login", async (data) => {
        console.log(data.user_id);
        console.log(data.user_name);
        const result = await 
        db.query(`INSERT INTO users (user_id, user_name) VALUES ('${data.user_id}', '${data.user_name}')`);
        client.log(result);
    });
    //const result = await db.query('SELECT * FROM test_table');
    //const results = { 'results': (result) ? result.rows : null};
};
