const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

// 获取某批次的环境记录
router.get('/batch/:batchId', (req, res) => {
  const db = getDb();
  const records = db.prepare(
    'SELECT * FROM environment_records WHERE batch_id = ? ORDER BY recorded_at DESC'
  ).all(req.params.batchId);
  res.json(records);
});

// 获取最新环境数据
router.get('/latest/:batchId', (req, res) => {
  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM environment_records WHERE batch_id = ? ORDER BY recorded_at DESC LIMIT 1'
  ).get(req.params.batchId);
  res.json(record || null);
});

// 录入环境监测数据(光温水气土)
router.post('/', (req, res) => {
  const db = getDb();
  const { batch_id, temperature, humidity, light_intensity, soil_ph, soil_moisture,
          soil_nitrogen, soil_phosphorus, soil_potassium, air_quality_index, co2_concentration, notes } = req.body;

  if (!batch_id) return res.status(400).json({ error: '批次ID为必填项' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO environment_records (id, batch_id, temperature, humidity, light_intensity,
      soil_ph, soil_moisture, soil_nitrogen, soil_phosphorus, soil_potassium,
      air_quality_index, co2_concentration, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, batch_id, temperature, humidity, light_intensity,
         soil_ph, soil_moisture, soil_nitrogen, soil_phosphorus, soil_potassium,
         air_quality_index, co2_concentration, notes || '');

  const record = db.prepare('SELECT * FROM environment_records WHERE id = ?').get(id);
  res.status(201).json(record);
});

// 获取环境数据统计(按月份)
router.get('/stats/:batchId', (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      strftime('%Y-%m', recorded_at) as month,
      ROUND(AVG(temperature), 1) as avg_temp,
      ROUND(AVG(humidity), 1) as avg_humidity,
      ROUND(AVG(light_intensity), 0) as avg_light,
      ROUND(AVG(soil_ph), 1) as avg_soil_ph,
      ROUND(AVG(soil_moisture), 1) as avg_soil_moisture,
      ROUND(AVG(air_quality_index), 0) as avg_aqi,
      COUNT(*) as record_count
    FROM environment_records
    WHERE batch_id = ?
    GROUP BY month
    ORDER BY month
  `).all(req.params.batchId);
  res.json(stats);
});

module.exports = router;
