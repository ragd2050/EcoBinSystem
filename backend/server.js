// ─────────────────────────────────────────
// EcoBin — Smart Recycling Management System
// Backend API Server
// ─────────────────────────────────────────

// 1) استدعاء المكتبات
const express = require("express");
const mysql   = require("mysql2");
const cors    = require("cors");

// 2) إنشاء السيرفر
const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// 3) الاتصال بقاعدة البيانات
// ─────────────────────────────────────────
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0

});

// اختبار الاتصال
db.getConnection((err, connection) => {

  if (err) {

    console.log("❌ DB Error:", err);

  } else {

    console.log("✅ Connected to MySQL");

    connection.release();
  }

});

// ─────────────────────────────────────────
// API: اختبار السيرفر
// ─────────────────────────────────────────
app.get("/test", (req, res) => {

  res.json({
    status: "ok",
    message: "API working ✅"
  });

});

// ─────────────────────────────────────────
// API: GET /bins
// ─────────────────────────────────────────
app.get("/bins", (req, res) => {

  const sql = `
    SELECT
      bin_id,
      location,
      capacity_kg,
      fill_level,
      status,
      waste_type_id
    FROM Bins
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.log("MYSQL ERROR:", err);

      return res.status(500).json({
        fatal: true,
        error: err.message
      });

    }

    res.json(result);

  });

});

// ─────────────────────────────────────────
// API: POST /bins
// ─────────────────────────────────────────
app.post("/bins", (req, res) => {

  const {
    bin_id,
    location,
    capacity_kg,
    fill_level,
    status
  } = req.body;

  const sql = `
    INSERT INTO Bins
    (bin_id, location, capacity_kg, fill_level, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      bin_id,
      location,
      capacity_kg,
      fill_level,
      status
    ],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json(err);

      }

      // Auto alert
      if (fill_level > 80) {

        const message =
          fill_level >= 90
          ? `Fill level critical (${fill_level}%)`
          : `Fill level high (${fill_level}%)`;

        db.query(
          `
          INSERT INTO Alerts
          (bin_id, message)
          VALUES (?, ?)
          `,
          [bin_id, message]
        );
      }

      res.json({
        success: true,
        message: "Bin added successfully ✅"
      });

    }
  );

});

// ─────────────────────────────────────────
// API: DELETE /bins/:id
// ─────────────────────────────────────────
app.delete("/bins/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "DELETE FROM Bins WHERE bin_id = ?",
    [id],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json(err);

      }

      res.json({
        message: "Bin deleted ✅"
      });

    }
  );

});

// ─────────────────────────────────────────
// API: PUT /bins/:id
// ─────────────────────────────────────────
app.put("/bins/:id", (req, res) => {

  const id = req.params.id;

  const {
    location,
    capacity_kg,
    fill_level,
    status
  } = req.body;

  const sql = `
    UPDATE Bins
    SET
      location = ?,
      capacity_kg = ?,
      fill_level = ?,
      status = ?
    WHERE bin_id = ?
  `;

  db.query(
    sql,
    [location, capacity_kg, fill_level, status, id],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json(err);

      }

      res.json({
        message: "Bin updated ✅"
      });

    }
  );

});

// ─────────────────────────────────────────
// API: GET /alerts
// ─────────────────────────────────────────
app.get("/alerts", (req, res) => {

  const sql = `
    SELECT
      a.alert_id,
      a.bin_id,
      b.location,
      a.message,
      a.created_at
    FROM Alerts a
    LEFT JOIN Bins b
      ON a.bin_id = b.bin_id
    ORDER BY a.created_at DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json(err);

    }

    res.json(result);

  });

});

// ─────────────────────────────────────────
// API: DELETE /alerts/:id
// ─────────────────────────────────────────
app.delete("/alerts/:id", (req, res) => {

  db.query(
    "DELETE FROM Alerts WHERE alert_id = ?",
    [req.params.id],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json(err);

      }

      res.json({
        message: "Alert deleted ✅"
      });

    }
  );

});

// ─────────────────────────────────────────
// API: GET /records
// ─────────────────────────────────────────
app.get("/records", (req, res) => {

  const sql = `
    SELECT
      d.record_id,
      d.bin_id,
      b.location,
      d.weight,
      d.disposal_date
    FROM DisposalRecords d
    LEFT JOIN Bins b
      ON d.bin_id = b.bin_id
    ORDER BY d.disposal_date DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.log(err);

      return res.status(500).json(err);

    }

    res.json(result);

  });

});

// ─────────────────────────────────────────
// تشغيل السيرفر
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);

});