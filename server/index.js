const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const herbsRouter = require('./routes/herbs');
const batchesRouter = require('./routes/batches');
const environmentRouter = require('./routes/environment');
const growthRouter = require('./routes/growth');
const farmersRouter = require('./routes/farmers');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/herbs', herbsRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/environment', environmentRouter);
app.use('/api/growth', growthRouter);
app.use('/api/farmers', farmersRouter);

// 溯源扫码入口 (通过批次码查询)
app.get('/trace/:batchCode', (req, res) => {
  res.redirect(`/api/batches/code/${req.params.batchCode}`);
});

// 首页
app.get('/', (req, res) => {
  res.json({
    name: '地宜本草溯源系统 API',
    version: '1.0.0',
    endpoints: {
      herbs: '/api/herbs',
      batches: '/api/batches',
      environment: '/api/environment',
      growth: '/api/growth',
      trace: '/trace/:batchCode'
    }
  });
});

// 初始化数据库后启动服务
(async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`地宜本草溯源服务已启动: http://localhost:${PORT}`);
  });
})();
