const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const DB_PATH = path.join(__dirname, 'traceability.db');

// 药材名到代码的映射
const HERB_CODES = {
  '黄芪': 'HQ', '党参': 'DS', '连翘': 'LQ', '柴胡': 'CH', '远志': 'YZ', '黄芩': 'HS'
};

// 扫码URL — 部署用 Pages，本地用 localhost
const PAGES_URL = process.env.PORT && process.env.PORT !== '3001' ? 'https://zxx1021.github.io/diyi-herb-trace' : 'http://localhost:5173';
const TRACE_BASE = PAGES_URL + '/#/trace/';

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
  let count = db.prepare('SELECT COUNT(*) as cnt FROM herbs').get();
  // 数据库版本检查：DB_VERSION 改变时自动重建种子数据
  const DB_VERSION = 4;
  db.exec("CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)");
  const oldVer = db.prepare("SELECT value FROM _meta WHERE key='version'").get();
  if (!oldVer || parseInt(oldVer.value) !== DB_VERSION) {
    db.exec("DELETE FROM growth_records; DELETE FROM environment_records; DELETE FROM farmers; DELETE FROM batches; DELETE FROM herbs; DELETE FROM _meta");
    count = { cnt: 0 };
    db.prepare("INSERT OR REPLACE INTO _meta VALUES('version',?)").run(String(DB_VERSION));
  }
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
    'INSERT INTO environment_records (id, batch_id, temperature, humidity, light_intensity, soil_ph, soil_moisture, soil_nitrogen, soil_phosphorus, soil_potassium, air_quality_index, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertGrowth = db.prepare(
    'INSERT INTO growth_records (id, batch_id, farmer_id, record_type, description, operator, dosage, weather, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertFarmer = db.prepare(
    'INSERT INTO farmers (id, name, phone, location, batch_id, qr_code_data) VALUES (?, ?, ?, ?, ?, ?)'
  );

  // 1. 先预生成农户ID和QR码（农户专属码）
  const pagesBase = TRACE_BASE.replace('/#/trace/', '');
  const farmerNames = [
    { name: '张大山', phone: '138****6789', location: '浑源县恒山基地' },
    { name: '李建国', phone: '139****7890', location: '长治市上党区基地' },
    { name: '王守田', phone: '136****8901', location: '陵川县古郊乡基地' }
  ];
  const farmerInfos = [];
  for (let i = 0; i < farmerNames.length; i++) {
    const f = farmerNames[i];
    const farmerId = uuidv4();
    const farmerQR = await QRCode.toDataURL(`${pagesBase}/#/farmer/${farmerId}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
    farmerInfos.push({ farmerId, name: f.name, phone: f.phone, location: f.location, qrData: farmerQR });
  }

  // 2. 生成批次QR码（药码+境码）+ 关联农户
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
        const qrTrace = await QRCode.toDataURL(`${TRACE_BASE}${batchCode}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
        const qrEnv = await QRCode.toDataURL(`${pagesBase}/#/batch-env/${batchId}`, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
        // 存储：药码、境码、关联农户ID
        const qrAll = JSON.stringify({ trace: qrTrace, env: qrEnv });
        batchInfos.push({
          batchId, herbId: herb.id, batchCode, qrImage: qrAll, loc: loc[i-1],
          idx: i === 1 ? '已采收' : '种植中', herbName: herb.name
        });
        // 前3个批次各关联一个农户
        const fiIdx = batchInfos.length - 1;
        if (fiIdx < farmerInfos.length) {
          farmerInfos[fiIdx].batchId = batchId;
        }
    }
  }

  // 3. 事务插入所有数据
  const insertAll = db.transaction(() => {
    for (const herb of herbs) {
      insertHerb.run(herb.id, herb.name, herb.scientific_name, herb.category, herb.origin, herb.description);
    }
    for (const bi of batchInfos) {
      const harvestDates = ['2025-10-15','2025-10-20','2025-10-16','2025-11-01','2025-10-18','2025-10-22','2025-10-15','2025-10-28','2025-10-15','2025-10-20','2025-10-14','2025-10-25'];
      const hdIdx = batchInfos.length - 1;
      insertBatch.run(bi.batchId, bi.herbId, bi.batchCode, bi.qrImage, harvestDates[hdIdx % harvestDates.length], bi.loc, 36.5 + Math.random() * 3, 112.0 + Math.random() * 3, bi.idx);
      // 环境监测：2024年4月到2026年6月，每月记录
      for (let y = 2024; y <= 2026; y++) {
        const endM = y === 2026 ? 6 : 12;
        const startM = y === 2024 ? 4 : 1;
        for (let m = startM; m <= endM; m++) {
          const mm = String(m).padStart(2, '0');
          const seasonTemp = m >= 6 && m <= 8 ? 22 + Math.random() * 12 : m >= 3 && m <= 5 ? 10 + Math.random() * 15 : -2 + Math.random() * 10;
          insertEnv.run(uuidv4(), bi.batchId,
            seasonTemp.toFixed(1),
            (45 + Math.random() * 35).toFixed(1),
            Math.round(15000 + Math.random() * 65000),
            (6.2 + Math.random() * 1.6).toFixed(1),
            (35 + Math.random() * 35).toFixed(1),
            (60 + Math.random() * 80).toFixed(1),
            (25 + Math.random() * 30).toFixed(1),
            (90 + Math.random() * 100).toFixed(1),
            Math.round(25 + Math.random() * 55),
            `${y}-${mm}-15 12:00:00`
          );
        }
      }
      // 种植操作：2024年4月到2026年6月，按生长节律
      const allOps = [
        {d:'2024-04-10',type:'松土',desc:'深耕整地，施入基肥',operator:'刘大山',dosage:'3000kg有机肥/亩',weather:'晴'},
        {d:'2024-04-20',type:'移栽',desc:'移栽种苗，株距20cm',operator:'王德发',dosage:'8000株/亩',weather:'多云'},
        {d:'2024-05-05',type:'浇灌',desc:'移栽后首次浇灌定根水',operator:'王德发',dosage:'800L/亩',weather:'晴'},
        {d:'2024-05-20',type:'除草',desc:'人工除草，松土保墒',operator:'刘大山',dosage:'-',weather:'阴'},
        {d:'2024-06-15',type:'施肥',desc:'追施复合肥，促进苗期生长',operator:'李守田',dosage:'30kg/亩',weather:'多云'},
        {d:'2024-06-28',type:'除虫',desc:'检查蚜虫，喷洒生物农药',operator:'赵建国',dosage:'150ml/亩',weather:'晴'},
        {d:'2024-07-15',type:'浇灌',desc:'夏季高温抗旱浇灌',operator:'王德发',dosage:'1000L/亩',weather:'晴'},
        {d:'2024-07-30',type:'除草',desc:'中耕除草，疏松土壤',operator:'刘大山',dosage:'-',weather:'阴'},
        {d:'2024-08-15',type:'除虫',desc:'释放赤眼蜂防治螟虫',operator:'赵建国',dosage:'8000头/亩',weather:'多云'},
        {d:'2024-08-28',type:'浇灌',desc:'秋季补水促根',operator:'王德发',dosage:'600L/亩',weather:'晴'},
        {d:'2024-09-20',type:'施肥',desc:'追施钾肥，促进根系发育',operator:'李守田',dosage:'20kg/亩',weather:'多云'},
        {d:'2024-10-10',type:'松土',desc:'秋耕培土，防寒准备',operator:'陈永福',dosage:'-',weather:'晴'},
        {d:'2025-03-15',type:'浇灌',desc:'返青水，促进春季萌发',operator:'王德发',dosage:'700L/亩',weather:'晴'},
        {d:'2025-03-28',type:'施肥',desc:'春季追肥，施用腐熟农家肥',operator:'李守田',dosage:'1000kg/亩',weather:'多云'},
        {d:'2025-04-20',type:'除草',desc:'春季人工除草',operator:'刘大山',dosage:'-',weather:'晴'},
        {d:'2025-05-10',type:'除虫',desc:'喷洒苦参碱防治蚜虫',operator:'赵建国',dosage:'200ml/亩',weather:'阴'},
        {d:'2025-05-25',type:'浇灌',desc:'花期补水',operator:'王德发',dosage:'500L/亩',weather:'多云'},
        {d:'2025-06-15',type:'施肥',desc:'花果期追施磷钾肥',operator:'李守田',dosage:'25kg/亩',weather:'晴'},
        {d:'2025-07-05',type:'除虫',desc:'检查红蜘蛛，喷施生物制剂',operator:'赵建国',dosage:'180ml/亩',weather:'晴'},
        {d:'2025-07-20',type:'浇灌',desc:'雨季排水后补浇',operator:'王德发',dosage:'400L/亩',weather:'小雨'},
        {d:'2025-08-10',type:'除草',desc:'清除田间杂草',operator:'刘大山',dosage:'-',weather:'多云'},
        {d:'2025-08-28',type:'除虫',desc:'秋季病虫害综合防治',operator:'赵建国',dosage:'160ml/亩',weather:'晴'},
        {d:'2025-09-15',type:'施肥',desc:'采收前追施微量元素肥',operator:'李守田',dosage:'15kg/亩',weather:'阴'},
        {d:'2025-10-01',type:'松土',desc:'采前松土，便于采收',operator:'陈永福',dosage:'-',weather:'晴'},
        {d:'2025-10-15',type:'采摘',desc:'秋季集中采收',operator:'张老三',dosage:'-',weather:'晴'},
        {d:'2025-10-25',type:'浇灌',desc:'采后补水恢复',operator:'王德发',dosage:'500L/亩',weather:'多云'},
        {d:'2025-11-10',type:'松土',desc:'冬季封冻前培土防寒',operator:'陈永福',dosage:'-',weather:'阴'},
        {d:'2026-03-20',type:'浇灌',desc:'春季返青浇灌',operator:'王德发',dosage:'650L/亩',weather:'晴'},
        {d:'2026-04-05',type:'施肥',desc:'春季追施有机复合肥',operator:'李守田',dosage:'800kg/亩',weather:'多云'},
        {d:'2026-05-01',type:'除虫',desc:'蚜虫高发期喷药防治',operator:'赵建国',dosage:'170ml/亩',weather:'晴'},
        {d:'2026-05-18',type:'除草',desc:'人工拔除田间杂草',operator:'刘大山',dosage:'-',weather:'阴'},
        {d:'2026-06-10',type:'浇灌',desc:'夏季高温保墒补水',operator:'王德发',dosage:'800L/亩',weather:'晴'},
      ];
      for (const op of allOps) {
        insertGrowth.run(uuidv4(), bi.batchId, null, op.type, op.desc, op.operator, op.dosage, op.weather, op.d + ' 08:00:00');
      }
    }
    for (const fi of farmerInfos) {
      if (fi.batchId) insertFarmer.run(fi.farmerId, fi.name, fi.phone, fi.location, fi.batchId, fi.qrData);
    }
  });
  insertAll();
  console.log('种子数据已插入(药码+农码+境码)');
}

module.exports = { getDb, initDatabase };
