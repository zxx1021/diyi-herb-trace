const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

// 获取某批次的种植操作记录
router.get('/batch/:batchId', (req, res) => {
  const db = getDb();
  const records = db.prepare(
    'SELECT * FROM growth_records WHERE batch_id = ? ORDER BY recorded_at DESC'
  ).all(req.params.batchId);
  res.json(records);
});

// 录入种植操作记录(除虫、浇灌、施肥等)
router.post('/', (req, res) => {
  const db = getDb();
  const { batch_id, record_type, description, operator, dosage, weather } = req.body;

  if (!batch_id || !record_type) {
    return res.status(400).json({ error: '批次ID和操作类型为必填项' });
  }

  const validTypes = ['浇灌', '除虫', '施肥', '除草', '松土', '采摘', '移栽', '其他'];
  if (!validTypes.includes(record_type)) {
    return res.status(400).json({ error: `操作类型无效，可选: ${validTypes.join(', ')}` });
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO growth_records (id, batch_id, record_type, description, operator, dosage, weather) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, batch_id, record_type, description || '', operator || '', dosage || '', weather || '');

  const record = db.prepare('SELECT * FROM growth_records WHERE id = ?').get(id);
  res.status(201).json(record);
});

// 获取操作统计
router.get('/stats/:batchId', (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT record_type, COUNT(*) as count
    FROM growth_records WHERE batch_id = ?
    GROUP BY record_type
  `).all(req.params.batchId);
  res.json(stats);
});

module.exports = router;
