require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 8080;

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
    return;
  }
  console.log(`✅ Connected to MySQL as ID ${db.threadId}`);
});

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Backend is running');
});

// 👉 GET all events
// app.get('/events', (req, res) => {
//   db.query('SELECT * FROM events', (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ error: 'Database query failed' });
//     }
//     res.json(results);
//   });
// });

// app.post('/book-event', (req, res) => {
//   const { clientName, clientNumber, eventDate, eventType, venue, totalAmount, advanceReceived, receivedBy } = req.body;

//   const sql = `INSERT INTO events 
//     (name, client_number, date, event_type, venue, total_amount, advance_received, received_by) 
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//   db.query(sql, [clientName, clientNumber, eventDate, eventType, venue, totalAmount, advanceReceived, receivedBy], (err, result) => {
//     if (err) {
//       console.error("❌ SQL Insert Error:", err);
//       return res.status(500).send("Database insert failed");
//     }
//     res.send("✅ Event booked successfully!");
//   });
// });

add.post("/book-event", (req, res) => {
  console.log("Form Data:", req.body);
  res.send("✅ Event booked successfully!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
