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

// 3) الاتصال بقاعدة البيانات
const db = mysql.createConnection({
  host:     "127.0.0.1",
  user:     "root",
  password: "200510",
  database: "EcoBinDB",
  port:     3307
});

// اختبار الاتصال
db.connect((err) => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ─────────────────────────────────────────
// API: اختبار السيرفر
// ─────────────────────────────────────────
app.get("/test", (req, res) => {
  res.json({ status: "ok", message: "API working ✅" });
});

// ─────────────────────────────────────────
// API: GET /bins — جلب جميع الحاويات
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
// API: POST /bins — إضافة حاوية جديدة
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
        res.status(500).json(err);
      } else {

        // auto alert
        if (fill_level > 80) {
          const message =
          fill_level >= 90
          ? `Fill level critical (${fill_level}%)`
          : `Fill level high (${fill_level}%);`

        

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
    }
  );

});

// ─────────────────────────────────────────
// API: DELETE /bins/:id — حذف حاوية
// ─────────────────────────────────────────
app.delete("/bins/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "DELETE FROM Bins WHERE bin_id = ?",
    [id],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).json(err);

      } else {

        res.json({
          message: "Bin deleted ✅"
        });
      }
    }
  );
});

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
        res.status(500).json(err);

      } else {
        res.json({
          message: "Bin updated ✅"
        });
      }
    }
  );
});

// ─────────────────────────────────────────
// API: GET /alerts — جلب التنبيهات
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
      res.status(500).json(err);
    } else {
      res.json(result);
    }

  });

});
// ─────────────────────────────────────────
// API: DELETE /alerts/:id — حذف تنبيه
// ─────────────────────────────────────────
app.delete("/alerts/:id", (req, res) => {

  db.query(
    "DELETE FROM Alerts WHERE alert_id = ?",
    [req.params.id],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).json(err);

      } else {

        res.json({
          message: "Alert deleted ✅"
        });
      }
    }
  );
});

// ─────────────────────────────────────────
// API: GET /records — سجلات التخلص
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
      res.status(500).json(err);
    } else {
      res.json(result);
    }

  });

});

// ─────────────────────────────────────────
// API: GET /sensor — قراءات الحساس
// ─────────────────────────────────────────
app.get("/sensor", (req, res) => {

  const sql = `
    SELECT
      s.reading_id,
      s.bin_id,
      b.location,
      s.fill_level,
      s.reading_time
    FROM SensorReadings s
    LEFT JOIN Bins b
      ON s.bin_id = b.bin_id
    ORDER BY s.reading_time DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      res.status(500).json(err);

    } else {
      res.json(result);
    }
  });
});

// ─────────────────────────────────────────
// API: GET /collections — عمليات الجمع
// ─────────────────────────────────────────
app.get("/collections", (req, res) => {

  const sql = `
    SELECT
      c.collection_id,
      c.bin_id,
      b.location,
      c.weight_removed,
      c.collection_time
    FROM Collections c
    LEFT JOIN Bins b
      ON c.bin_id = b.bin_id
    ORDER BY c.collection_time DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      res.status(500).json(err);

    } else {
      res.json(result);
    }
  });
});

// ─────────────────────────────────────────
// API: GET /recycling-outcomes
// ─────────────────────────────────────────
app.get("/recycling-outcomes", (req, res) => {

  const sql = `
    SELECT
      r.outcome_id,
      r.waste_type_id,
      w.type_name,
      r.outcome_name,
      r.environmental_benefit
    FROM RecyclingOutcomes r
    LEFT JOIN WasteTypes w
      ON r.waste_type_id = w.waste_type_id
    ORDER BY r.waste_type_id
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      res.status(500).json(err);

    } else {
      res.json(result);
    }
  });
});

// ─────────────────────────────────────────
// API: GET /bin-waste-types
// ─────────────────────────────────────────
app.get("/bin-waste-types", (req, res) => {

  const sql = `
    SELECT
      bw.bin_id,
      bw.waste_type_id,
      w.type_name
    FROM BinWasteTypes bw
    LEFT JOIN WasteTypes w
      ON bw.waste_type_id = w.waste_type_id
    ORDER BY bw.bin_id
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      res.status(500).json(err);

    } else {
      res.json(result);
    }
  });
});

// ─────────────────────────────────────────
// API: GET /reports — تقارير
// ─────────────────────────────────────────
app.get("/reports", (req, res) => {

  const results = {};

  // Total bins
  db.query(
    "SELECT COUNT(*) AS total_bins FROM Bins",
    (err, r) => {

      if (!err) {
        results.total_bins = r[0].total_bins;
      }

      // Full bins
      db.query(
        "SELECT COUNT(*) AS full_bins FROM Bins WHERE fill_level > 80",
        (err2, r2) => {

          if (!err2) {
            results.full_bins = r2[0].full_bins;
          }

          // Total waste
          db.query(
            "SELECT COALESCE(SUM(weight),0) AS total_kg FROM DisposalRecords",
            (err3, r3) => {

              if (!err3) {

                results.total_waste_kg =
                  parseFloat(r3[0].total_kg);

                results.recycled_kg =
                  parseFloat((r3[0].total_kg * 0.68).toFixed(1));
              }

              // Total alerts
              db.query(
                "SELECT COUNT(*) AS active_alerts FROM Alerts",
                (err4, r4) => {

                  if (!err4) {
                    results.active_alerts =
                      r4[0].active_alerts;
                  }

                  // Bins per waste type
                  db.query(`
                    SELECT
                      w.type_name,
                      COUNT(DISTINCT bw.bin_id) AS total_bins
                    FROM WasteTypes w
                    LEFT JOIN BinWasteTypes bw
                      ON w.waste_type_id = bw.waste_type_id
                    GROUP BY w.type_name
                  `,
                  (err5, r5) => {

                    if (!err5) {
                      results.bins_by_type = r5;
                    }

                    res.json({
                      summary: results
                    });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// ─────────────────────────────────────────
// تشغيل السيرفر
// ─────────────────────────────────────────
app.listen(3000, () => {

  console.log("🚀 Server running on http://localhost:3000");

  console.log("──────────────────────────────────────");

  console.log("GET     /bins");
  console.log("POST    /bins");
  console.log("DELETE  /bins/:id");

  console.log("GET     /alerts");
  console.log("DELETE  /alerts/:id");

  console.log("GET     /records");
  console.log("GET     /sensor");
  console.log("GET     /collections");

  console.log("GET     /recycling-outcomes");
  console.log("GET     /bin-waste-types");

  console.log("GET     /reports");
  console.log("GET     /test");

  console.log("──────────────────────────────────────");
});