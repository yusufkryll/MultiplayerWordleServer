const Network = require('./Network');
const { Pool } = require('pg');

var port = process.env.PORT || 8080;
var network = new Network(port, {});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


network.onConnect = client => {
    console.log("A player connected: " + client.id);  
};
