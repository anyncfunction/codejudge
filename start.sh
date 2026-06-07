#!/bin/bash
# CodeJudge 一键启动脚本（Linux/macOS）
set -e

echo "=== CodeJudge 一键启动 ==="

# 安装后端依赖
echo "[1/4] 安装后端依赖..."
cd backend
npm install --omit=dev

# 安装前端依赖并构建
echo "[2/4] 构建前端..."
cd ../frontend
npm install
npm run build

# 生成题库（如数据库为空）
echo "[3/4] 检查题库..."
cd ../backend
node -e "
const { initDb } = require('./src/utils/initDb');
initDb().then(() => {
  const { queryOne } = require('./src/config/db');
  const count = queryOne('SELECT COUNT(*) as count FROM problems').count;
  if (count === 0) {
    console.log('生成题库中...');
    require('./src/utils/seedLarge');
  } else {
    console.log('题库已就绪 (' + count + ' 题)');
  }
});
"

echo "[4/4] 启动服务器..."
node src/app.js
