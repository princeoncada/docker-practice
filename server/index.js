const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Client Setup
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: keys.mysqlHost,
    user: keys.mysqlUser,
    password: keys.mysqlPassword,
    database: keys.mysqlDatabase,
    port: keys.mysqlPort,
});

// MySQL Pool Connection Test
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Error connecting to MySQL: ', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// MySQL low-level migration
pool
    .query(
        `CREATE TABLE IF NOT EXISTS tbl_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data VARCHAR(255));`
    )
    .catch((err) => {
        console.log('Error creating table: ', err);
    });

// ***********************
// QUERIES AND ROUTES HERE
// ***********************
app.get('/data', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('SELECT * FROM tbl_test');
        res.json(rows);
    } catch (err) {
        console.log('Error querying data: ', err);
    }
});

// 5000 is default, you may change as needed
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});