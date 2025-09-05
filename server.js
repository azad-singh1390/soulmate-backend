const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection using Railway environment variables
const db = mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT
});

// API: Add event
app.post("/addevent", (req, res) => {
const { date, client, quotation, details } = req.body;
const sql = "INSERT INTO events (date, client, quotation, details) VALUES (?, ?, ?, ?)";
db.query(sql, [date, client, quotation, details], (err, result) => {
if (err) {
console.error(err);
return res.status(500).send("Database error");
}
res.send("Event added successfully!");
});
});

// API: Get all events
app.get("/events", (req, res) => {
db.query("SELECT * FROM events", (err, results) => {
if (err) {
console.error(err);
return res.status(500).send("Database error");
}
res.json(results);
});
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
