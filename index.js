const Network = require('./Network');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

network.onConnect = (client, db) => {
    console.log("A player connected: " + client.id);  
    db.query('SELECT * FROM test_table', (err, result) => {
        const results = { 'results': (result) ? result.rows : null};
        console.log(results);
        client.send("dbtest", "t");
        db.release();
    });
};
