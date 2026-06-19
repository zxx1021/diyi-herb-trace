const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const TRACE_BASE = process.env.TRACE_BASE_URL || (process.env.PORT && process.env.PORT !== '3001' ? 'https://zxx1021.github.io/diyi-herb-trace/#/trace/' : 'http://localhost:5173/#/trace/');

// 获取所有农户
router.get('/', (req, res) => {
  const db = getDb();
  const farmers = db.prepare(`
    SELECT f.*, b.batch_code, h.name as herb_name
    FROM farmers f
    LEFT JOIN batches b ON f.batch_id = b.id
    LEFT JOIN herbs h ON b.herb_id = h.id
    ORDER BY f.created_at DESC
  `).all();
  res.json(farmers);
});

// 获取单个农户详情(含记录)
router.get('/:id', (req, res) => {
  const db = getDb();
  const farmer = db.prepare(`
    SELECT f.*, b.batch_code, h.name as herb_name, h.origin as herb_origin
    FROM farmers f
    LEFT JOIN batches b ON f.batch_id = b.id
    LEFT JOIN herbs h ON b.herb_id = h.id
    WHERE f.id = ?
  `).get(req.params.id);
  if (!farmer) return res.status(404).json({ error: '农户不存在' });

  const records = db.prepare(
    'SELECT * FROM growth_records WHERE farmer_id = ? ORDER BY recorded_at DESC'
  ).all(req.params.id);

  // 获取可用的批次列表
  const batches = db.prepare(`
    SELECT b.id, b.batch_code, h.name as herb_name
    FROM batches b JOIN herbs h ON b.herb_id = h.id
    ORDER BY b.created_at DESC
  `).all();

  res.json({ ...farmer, records, batches });
});

// 获取农户的批次列表(供公开页面使用)
router.get('/:id/batches', (req, res) => {
  const db = getDb();
  const batches = db.prepare(`
    SELECT b.id, b.batch_code, h.name as herb_name
    FROM batches b JOIN herbs h ON b.herb_id = h.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(batches);
});

// 创建农户并生成QR码
router.post('/', async (req, res) => {
  const db = getDb();
  const { name, phone, location, batch_id } = req.body;
  if (!name) return res.status(400).json({ error: '农户姓名为必填项' });

  const id = uuidv4();
  const farmerQR = await QRCode.toDataURL(`${TRACE_BASE}farmer/${id}`, {
    width: 400, margin: 2, errorCorrectionLevel: 'M'
  });

  db.prepare(
    'INSERT INTO farmers (id, name, phone, location, batch_id, qr_code_data) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, phone || '', location || '', batch_id || null, farmerQR);

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
  res.status(201).json(farmer);
});

// 农户通过扫码上传种植记录(公开接口)
router.post('/:id/records', (req, res) => {
  const db = getDb();
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!farmer) return res.status(404).json({ error: '农户不存在' });

  const { batch_id, record_type, description, dosage, weather } = req.body;
  if (!batch_id || !record_type) return res.status(400).json({ error: '批次和操作类型为必填项' });

  const validTypes = ['浇灌', '除虫', '施肥', '除草', '松土', '采摘', '移栽', '其他'];
  if (!validTypes.includes(record_type)) {
    return res.status(400).json({ error: '无效操作类型' });
  }

  const recordId = uuidv4();
  db.prepare(
    'INSERT INTO growth_records (id, batch_id, farmer_id, record_type, description, operator, dosage, weather) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(recordId, batch_id, req.params.id, record_type, description || '', farmer.name, dosage || '', weather || '');

  const record = db.prepare('SELECT * FROM growth_records WHERE id = ?').get(recordId);
  res.status(201).json(record);
});

// 删除农户
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM farmers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
