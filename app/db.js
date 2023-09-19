const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://<username>:<password>@cluster-url/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db = null;

async function connect() {
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected to the database');

        db = client.db('slackwhatsapp');
        console.log('Database initialized');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

function getDB() {
    return db;
}

module.exports = { connect, getDB };
