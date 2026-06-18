const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const DB_PATH = path.join(__dirname, 'traceability.db');

// 药材名到代码的映射
const HERB_CODES = {
  '黄芪': 'HQ', '党参': 'DS', '连翘': 'LQ', '柴胡': 'CH', '远志': 'YZ', '黄芩': 'HS'
};

// 溯源扫描基础URL - 部署时用GitHub Pages hash路由，本地开发用localhost
const TRACE_BASE = process.env.TRACE_BASE_URL || (process.env.RAILWAY_SERVICE_ID ? 'https://zxx1021.github.io/diyi-herb-trace/#/trace/' : 'http://localhost:5173/#/trace/');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

async function initDatabase() {
  const db = getDb();

  db.exec(`
    -- 药材品种表
    CREATE TABLE IF NOT EXISTS herbs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scientific_name TEXT,
      category TEXT,
      origin TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    -- 药材批次表 (一药一码核心)
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      herb_id TEXT NOT NULL,
      batch_code TEXT NOT NULL UNIQUE,
      qr_code_data TEXT,
      harvest_date TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT '种植中',
      quality_grade TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (herb_id) REFERENCES herbs(id)
    );

    -- 环境监测记录 (光温水气土)
    CREATE TABLE IF NOT EXISTS environment_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      temperature REAL,
      humidity REAL,
      light_intensity REAL,
      soil_ph REAL,
      soil_moisture REAL,
      soil_nitrogen REAL,
      soil_phosphorus REAL,
      soil_potassium REAL,
      air_quality_index REAL,
      co2_concentration REAL,
      recorded_at DATETIME DEFAULT (datetime('now', 'localtime')),
      notes TEXT,
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    -- 农户表 (农户扫码上传种植数据)
    CREATE TABLE IF NOT EXISTS farmers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      batch_id TEXT,
      qr_code_data TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    -- 种植操作记录 (除虫、浇灌、施肥等)
    CREATE TABLE IF NOT EXISTS growth_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      farmer_id TEXT,
      record_type TEXT NOT NULL,
      description TEXT,
      operator TEXT,
      dosage TEXT,
      weather TEXT,
      recorded_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    );

    -- 溯源扫码日志
    CREATE TABLE IF NOT EXISTS trace_logs (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      scan_time DATETIME DEFAULT (datetime('now', 'localtime')),
      ip_address TEXT,
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );
  `);

  // 插入山西道地药材种子数据
  const count = db.prepare('SELECT COUNT(*) as cnt FROM herbs').get();
  if (count.cnt === 0) {
    await seedData(db);
  }
}

async function seedData(db) {
  const herbs = [
    { id: uuidv4(), name: '黄芪', scientific_name: 'Astragalus membranaceus', category: '根茎类', origin: '山西省浑源县', description: '山西道地药材，浑源黄芪又称"正北芪"，品质优良，药用价值高。' },
    { id: uuidv4(), name: '党参', scientific_name: 'Codonopsis pilosula', category: '根茎类', origin: '山西省长治市', description: '上党党参，山西传统道地药材，根条肥大、质柔润。' },
    { id: uuidv4(), name: '连翘', scientific_name: 'Forsythia suspensa', category: '果实类', origin: '山西省陵川县', description: '陵川连翘，果实饱满，连翘苷含量高，为国家地理标志产品。' },
    { id: uuidv4(), name: '柴胡', scientific_name: 'Bupleurum chinense', category: '根茎类', origin: '山西省', description: '山西柴胡品质优良，柴胡皂苷含量高于国家标准。' },
    { id: uuidv4(), name: '远志', scientific_name: 'Polygala tenuifolia', category: '根茎类', origin: '山西省', description: '远志为山西道地药材，安神益智之要药。' },
    { id: uuidv4(), name: '黄芩', scientific_name: 'Scutellaria baicalensis', category: '根茎类', origin: '山西省', description: '山西黄芩，黄芩苷含量丰富，清热燥湿良药。' }
  ];

  const insertHerb = db.prepare(
    'INSERT INTO herbs (id, name, scientific_name, category, origin, description) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const insertBatch = db.prepare(
    'INSERT INTO batches (id, herb_id, batch_code, qr_code_data, harvest_date, location, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertEnv = db.prepare(
    'INSERT INTO environment_records (id, batch_id, temperature, humidity, light_intensity, soil_ph, soil_moisture, soil_nitrogen, soil_phosphorus, soil_potassium, air_quality_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertGrowth = db.prepare(
    'INSERT INTO growth_records (id, batch_id, farmer_id, record_type, description, operator, dosage, weather) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertFarmer = db.prepare(
    'INSERT INTO farmers (id, name, phone, location, batch_id, qr_code_data) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // 预先生成所有批次的QR码数据
  const batchInfos = [];
  for (const herb of herbs) {
    for (let i = 1; i <= 2; i++) {
      const batchId = uuidv4();
      const code = HERB_CODES[herb.name] || herb.name.substring(0, 2).toUpperCase();
      const batchCode = `${code}${String(i).padStart(3, '0')}-${new Date().getFullYear()}`;
      const locations = {
          '黄芪': ['浑源县恒山种植基地', '浑源县千佛岭基地'],
          '党参': ['长治市上党区基地', '长治市壶关县基地'],
          '连翘': ['陵川县古郊乡基地', '陵川县六泉乡基地'],
          '柴胡': ['运城市闻喜基地', '临汾市安泽基地'],
          '远志': ['临汾市洪洞基地', '运城市万荣基地'],
          '黄芩': ['忻州市五寨基地', '晋城市陵川基地']
        };
        const loc = locations[herb.name] || ['山西种植基地A', '山西种植基地B'];
        const qrData = `${TRACE_BASE}${batchCode}`;
        const qrImage = await QRCode.toDataURL(qrData, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
        batchInfos.push({
          batchId, herbId: herb.id, batchCode, qrImage, loc: loc[i-1],
          idx: i === 1 ? '已采收' : '种植中', herbName: herb.name
        });
    }
  }

  // 事务插入数据
  const insertAll = db.transaction(() => {
    for (const herb of herbs) {
      insertHerb.run(herb.id, herb.name, herb.scientific_name, herb.category, herb.origin, herb.description);
    }
    for (const bi of batchInfos) {
      insertBatch.run(
        bi.batchId, bi.herbId, bi.batchCode, bi.qrImage, '2025-10-15',
        bi.loc, 36.5 + Math.random() * 3, 112.0 + Math.random() * 3, bi.idx
      );

      // 环境监测数据
      const months = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
      for (const month of months) {
        insertEnv.run(
          uuidv4(), bi.batchId,
          (18 + Math.random() * 15).toFixed(1),
          (40 + Math.random() * 40).toFixed(1),
          (20000 + Math.random() * 60000).toFixed(0),
          (6.0 + Math.random() * 2).toFixed(1),
          (30 + Math.random() * 40).toFixed(1),
          (50 + Math.random() * 100).toFixed(1),
          (20 + Math.random() * 40).toFixed(1),
          (80 + Math.random() * 120).toFixed(1),
          (30 + Math.random() * 50).toFixed(0)
        );
      }

      // 种植操作记录
      const operations = [
        { type: '浇灌', desc: '滴灌系统自动浇灌', operator: '张三', dosage: '500L/亩', weather: '晴' },
        { type: '施肥', desc: '施用有机肥', operator: '李四', dosage: '200kg/亩', weather: '多云' },
        { type: '除虫', desc: '生物防治-释放赤眼蜂', operator: '王五', dosage: '10000头/亩', weather: '阴' },
        { type: '除虫', desc: '喷洒苦参碱植物源农药', operator: '王五', dosage: '200ml/亩', weather: '晴' },
        { type: '浇灌', desc: '喷灌补水', operator: '张三', dosage: '300L/亩', weather: '晴' },
        { type: '除草', desc: '人工除草', operator: '赵六', dosage: '-', weather: '晴' },
      ];
      for (const op of operations) {
        insertGrowth.run(uuidv4(), bi.batchId, null, op.type, op.desc, op.operator, op.dosage, op.weather);
      }
    }

  });

  // 种子农户 (QR码生成需async，放在事务外)
  const farmerNames = [
    { name: '张大山', phone: '138****6789', location: '浑源县恒山基地' },
    { name: '李建国', phone: '139****7890', location: '长治市上党区基地' },
    { name: '王守田', phone: '136****8901', location: '陵川县古郊乡基地' }
  ];
  const farmerInfos = [];
  for (let i = 0; i < farmerNames.length; i++) {
    const f = farmerNames[i];
    const farmerId = uuidv4();
    const targetBatch = batchInfos[i];
    const farmerQR = await QRCode.toDataURL(`${TRACE_BASE}farmer/${farmerId}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
    farmerInfos.push({ farmerId, name: f.name, phone: f.phone, location: f.location, batchId: targetBatch.batchId, qrData: farmerQR });
  }

  insertAll();

  // 插入农户（QR码已异步生成）
  for (const fi of farmerInfos) {
    insertFarmer.run(fi.farmerId, fi.name, fi.phone, fi.location, fi.batchId, fi.qrData);
  }

  console.log('种子数据已插入(含QR码+农户)');
}

module.exports = { getDb, initDatabase };
