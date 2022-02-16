const Network = require('./Network');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

network.onConnect = async (client, db) => {
    console.log("A player connected: " + client.id);  
    client.on("guest-login", async (data) => {
        const result = await db.query('SELECT * FROM test_table');
        const results = { 'results': (result) ? result.rows : null};
        client.log(results);
    });
    //const result = await db.query('SELECT * FROM test_table');
    //const results = { 'results': (result) ? result.rows : null};
};
