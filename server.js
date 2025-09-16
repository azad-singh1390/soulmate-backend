require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // use promise-based API
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://azad-singh1390.github.io"],
  methods: ["GET", "POST", "DELETE", "PUT"],
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
          event_start_date DATE NOT NULL,
          event_end_date DATE NOT NULL,
          event_time TIME NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          venue VARCHAR(100) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          advance_received DECIMAL(10,2) NOT NULL,
          received_by VARCHAR(50) NOT NULL,
          pdf_file LONGBLOB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("🆕 Table 'bookings' created with PDF and event_time columns");
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

const multer = require('multer');

// ✅ Multer setup to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 👉 POST: Insert booking with PDF
// 👉 POST: Insert booking with PDF
app.post("/book-event", upload.single("pdfUpload"), async (req, res) => {
  try {
    const {
      clientname,
      clientNumber,
      startDate,
      endDate,
      eventTime,
      eventType,
      venue,
      totalAmount,
      advanceReceived,
      receivedBy
    } = req.body;

    console.log("📄 Uploaded file:", req.file);
    // ✅ Save raw PDF file as BLOB in MySQL
    const pdfFile = req.file ? req.file.buffer : null;

    await pool.query(`
      INSERT INTO bookings 
      (client_name, client_number, event_start_date, event_end_date, event_time, event_type, venue, total_amount, advance_received, received_by, pdf_file)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      clientname,
      clientNumber,
      startDate,
      endDate,
      eventTime,
      eventType,
      venue,
      totalAmount,
      advanceReceived,
      receivedBy,
      pdfFile
    ]);

    res.json({ message: "Success" });
  } catch (err) {
    console.error("❌ Error inserting booking:", err);
    res.status(500).json({ message: "Database error" });
  }
});



// ✅ Route to get notification count (events within 2 days)
app.get("/notifications/count", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM bookings 
      WHERE event_start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
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
    const [results] = await pool.query("SELECT * FROM bookings ORDER BY event_start_date ASC");
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
      SELECT client_name, client_number, event_start_date, event_end_date, event_type, venue, event_time, pdf_file
      FROM bookings 
      WHERE event_start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);
    res.json({ rows });
  } catch (err) {
    console.error("❌ Error fetching notification count:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});


// 👉 Delete all bookings and reset ID counter
app.delete("/bookings/reset", async (req, res) => {
  try {
    await pool.query("TRUNCATE TABLE bookings");
    res.json({ message: "All bookings deleted, ID reset to 1" });
  } catch (err) {
    console.error("❌ Error resetting bookings:", err);
    res.status(500).json({ error: "Failed to reset bookings" });
  }
});

// ✅ Update booking (partial update with only changed fields)
app.put("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const { changes, password } = req.body;

  console.log(req.body);

  if (!id || Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

   // 1. Check password
  if (password !== "Soulmate@5555") {
    return res.status(403).json({ error: "Invalid password" });
  }

  try {
    // Dynamically build SET clause
    const fields = Object.keys(changes)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(changes);

    const sql = `UPDATE bookings SET ${fields} WHERE id = ?`;

    const [result] = await pool.query(sql, [...values, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking updated successfully" });
  } catch (err) {
    console.error("❌ Error updating booking:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
