require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // use promise-based API
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://azad-singh1390.github.io"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,   // max simultaneous connections
  queueLimit: 0
});

// Check and create bookings table if needed
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL`);

    const [rows] = await conn.query("SHOW TABLES LIKE 'bookings'");
    if (rows.length === 0) {
      await conn.query(`
        CREATE TABLE bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_name VARCHAR(100) NOT NULL,
          client_number VARCHAR(20) NOT NULL,
          event_date DATE NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          venue VARCHAR(100) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          advance_received DECIMAL(10,2) NOT NULL,
          received_by VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("🆕 Table 'bookings' created");
    } else {
      console.log("ℹ️ Table 'bookings' already exists");
    }
    conn.release(); // release back to pool
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
  }
})();

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Backend is running');
});

// 👉 POST: Insert booking
app.post("/book-event", async (req, res) => {
  try {
    const {
      clientname,
      clientNumber,
      eventDate,
      eventType,
      venue,
      totalAmount,
      advanceReceived,
      receivedBy
    } = req.body;

    const sql = `
      INSERT INTO bookings 
      (client_name, client_number, event_date, event_type, venue, total_amount, advance_received, received_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      clientname, clientNumber, eventDate, eventType, venue, totalAmount, advanceReceived, receivedBy
    ]);

    console.log("✅ New booking inserted with ID:", result.insertId);
    res.json({ message: "Success" });

  } catch (err) {
    console.error("❌ Error inserting booking:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});


// ✅ Route to get notification count (events within 2 days)
app.get("/notifications/count", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM bookings 
      WHERE event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
    `);
    res.json({ count: rows[0].total });
  } catch (err) {
    console.error("❌ Error fetching notification count:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// 👉 GET all bookings sorted by event_date
app.get("/bookings", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM bookings ORDER BY event_date ASC");
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});


// 👉 GET all bookings sorted by event_date
app.get("/comingbookings", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT client_name, event_date, venue, event_type
      FROM bookings 
      WHERE event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
    `);
    res.json({ count: rows[0].total });
  } catch (err) {
    console.error("❌ Error fetching notification count:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
