const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const HERB_CODES = {
  '黄芪': 'HQ', '党参': 'DS', '连翘': 'LQ', '柴胡': 'CH', '远志': 'YZ', '黄芩': 'HS'
};

// 溯源扫描基础URL — Railway用Pages hash路由，本地用localhost
const TRACE_BASE = process.env.TRACE_BASE_URL || (process.env.RAILWAY_SERVICE_ID ? 'https://zxx1021.github.io/diyi-herb-trace/#/trace/' : 'http://localhost:5173/#/trace/');

// 获取所有批次
router.get('/', (req, res) => {
  const db = getDb();
  const batches = db.prepare(`
    SELECT b.*, h.name as herb_name, h.origin as herb_origin
    FROM batches b JOIN herbs h ON b.herb_id = h.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(batches);
});

// 获取单个批次详情(含环境数据和操作记录)
router.get('/:id', (req, res) => {
  const db = getDb();
  const batch = db.prepare(`
    SELECT b.*, h.name as herb_name, h.scientific_name, h.category, h.origin as herb_origin, h.description as herb_description
    FROM batches b JOIN herbs h ON b.herb_id = h.id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });

  const envRecords = db.prepare(
    'SELECT * FROM environment_records WHERE batch_id = ? ORDER BY recorded_at DESC'
  ).all(req.params.id);

  const growthRecords = db.prepare(
    'SELECT * FROM growth_records WHERE batch_id = ? ORDER BY recorded_at DESC'
  ).all(req.params.id);

  // 统计除虫和浇灌次数
  const pestCount = db.prepare(
    "SELECT COUNT(*) as cnt FROM growth_records WHERE batch_id = ? AND record_type = '除虫'"
  ).get(req.params.id).cnt;

  const irrigationCount = db.prepare(
    "SELECT COUNT(*) as cnt FROM growth_records WHERE batch_id = ? AND record_type = '浇灌'"
  ).get(req.params.id).cnt;

  const fertilizeCount = db.prepare(
    "SELECT COUNT(*) as cnt FROM growth_records WHERE batch_id = ? AND record_type = '施肥'"
  ).get(req.params.id).cnt;

  res.json({
    ...batch,
    environment_records: envRecords,
    growth_records: growthRecords,
    stats: {
      pest_control_count: pestCount,
      irrigation_count: irrigationCount,
      fertilize_count: fertilizeCount,
      total_env_records: envRecords.length,
      total_growth_records: growthRecords.length
    }
  });
});

// 通过批次码获取详情(扫码入口)
router.get('/code/:batchCode', (req, res) => {
  const db = getDb();
  const batch = db.prepare(
    'SELECT * FROM batches WHERE batch_code = ?'
  ).get(req.params.batchCode);
  if (!batch) return res.status(404).json({ error: '批次码不存在' });

  // 记录扫码日志
  db.prepare('INSERT INTO trace_logs (id, batch_id, ip_address) VALUES (?, ?, ?)').run(
    uuidv4(), batch.id, req.ip
  );

  // 重定向到批次详情
  res.redirect(`/api/batches/${batch.id}`);
});

// 创建新批次并生成QR码
router.post('/', async (req, res) => {
  const db = getDb();
  const { herb_id, harvest_date, location, latitude, longitude, notes } = req.body;
  if (!herb_id || !location) return res.status(400).json({ error: '药材和地点为必填项' });

  const herb = db.prepare('SELECT * FROM herbs WHERE id = ?').get(herb_id);
  if (!herb) return res.status(404).json({ error: '药材不存在' });

  // 生成批次码
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const prefix = HERB_CODES[herb.name] || herb.name.substring(0, 2).toUpperCase();
  const seq = db.prepare("SELECT COUNT(*) as cnt FROM batches WHERE batch_code LIKE ?").get(`${prefix}%`).cnt + 1;
  const batchCode = `${prefix}${dateStr}${String(seq).padStart(3, '0')}`;

  const id = uuidv4();

  // 生成QR码：药码(溯源) + 境码(环境监测)，农码从农户表获取
  const pagesBase = TRACE_BASE.replace('/#/trace/', '');
  const qrTrace = await QRCode.toDataURL(`${TRACE_BASE}${batchCode}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
  const qrEnv = await QRCode.toDataURL(`${pagesBase}/#/batch-env/${id}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
  const qrImage = JSON.stringify({ trace: qrTrace, env: qrEnv });

  db.prepare(
    'INSERT INTO batches (id, herb_id, batch_code, qr_code_data, harvest_date, location, latitude, longitude, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, herb_id, batchCode, qrImage, harvest_date || '', location, latitude || 0, longitude || 0, notes || '');

  const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  res.status(201).json(batch);
});

// 删除批次
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM batches WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
