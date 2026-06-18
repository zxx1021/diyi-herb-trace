const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

// 获取所有药材
router.get('/', (req, res) => {
  const db = getDb();
  const herbs = db.prepare('SELECT * FROM herbs ORDER BY created_at DESC').all();
  res.json(herbs);
});

// 获取单个药材详情(含批次)
router.get('/:id', (req, res) => {
  const db = getDb();
  const herb = db.prepare('SELECT * FROM herbs WHERE id = ?').get(req.params.id);
  if (!herb) return res.status(404).json({ error: '药材不存在' });
  const batches = db.prepare('SELECT * FROM batches WHERE herb_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...herb, batches });
});

// 新增药材
router.post('/', (req, res) => {
  const db = getDb();
  const { name, scientific_name, category, origin, description } = req.body;
  if (!name || !origin) return res.status(400).json({ error: '药材名称和产地为必填项' });
  const id = uuidv4();
  db.prepare(
    'INSERT INTO herbs (id, name, scientific_name, category, origin, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, scientific_name || '', category || '', origin, description || '');
  const herb = db.prepare('SELECT * FROM herbs WHERE id = ?').get(id);
  res.status(201).json(herb);
});

// 更新药材
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, scientific_name, category, origin, description } = req.body;
  db.prepare(
    'UPDATE herbs SET name=?, scientific_name=?, category=?, origin=?, description=? WHERE id=?'
  ).run(name, scientific_name, category, origin, description, req.params.id);
  const herb = db.prepare('SELECT * FROM herbs WHERE id = ?').get(req.params.id);
  res.json(herb);
});

// 删除药材
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM herbs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
