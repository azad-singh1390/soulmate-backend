require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 8080;
const cors = require('cors');  

app.use(cors({
  origin: ["http://127.0.0.1:5500", "https://azad-singh1390.github.io"], // update with your real frontend URL
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));


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

   db.query("SHOW TABLES LIKE 'bookings'", (err, result) => {
    if (err) {
      console.error("❌ Error checking 'bookings' table:", err);
      return;
    }

    if (result.length === 0) {
      db.query(`
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
      `, (err) => {
        if (err) {
          console.error("❌ Error creating 'bookings' table:", err);
        } else {
          console.log("🆕 Table 'bookings' did not exist → created successfully");
        }
      });
    } else {
      console.log("ℹ️ Table 'bookings' already exists");
    }
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

// app.post("/book-event", (req, res) => {
//   console.log("Form Data:", req.body);
//   res.send("✅ Event booked successfully!");
// });

// 👉 POST: Insert into bookings table
app.post("/book-event", (req, res) => {
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

  db.query(
    sql,
    [clientname, clientNumber, eventDate, eventType, venue, totalAmount, advanceReceived, receivedBy],
    (err, result) => {
      if (err) {
        console.error("❌ Error inserting booking:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      console.log("✅ New booking inserted with ID:", result.insertId);
      res.json({ message: "Booking added successfully!", bookingId: result.insertId });
    }
  );
});

// 👉 GET all bookings sorted by event_date
app.get("/bookings", (req, res) => {
  const sql = "SELECT * FROM bookings ORDER BY event_date ASC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching bookings:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
