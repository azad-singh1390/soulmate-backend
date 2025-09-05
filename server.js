const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database");
});

// API: Add event
app.post("/events", (req, res) => {
  const { date, client, quotation, details } = req.body;
  const sql = "INSERT INTO events (date, client, quotation, details) VALUES (?, ?, ?, ?)";
  db.query(sql, [date, client, quotation, details], (err, result) => {
    if (err) {
      console.error("Insert error:", err.sqlMessage);
      return res.status(500).json({ error: "Failed to add event", details: err.sqlMessage });
    }
    res.status(201).json({ message: "Event added successfully", id: result.insertId });
  });
});

// API: Get all events
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events", (err, results) => {
    if (err) {
      console.error("Select error:", err.sqlMessage);
      return res.status(500).json({ error: "Failed to fetch events", details: err.sqlMessage });
    }
    res.json(results);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
