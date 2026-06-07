@echo off
chcp 65001 >nul
echo === CodeJudge 一键启动 ===

echo [1/4] 安装后端依赖...
cd backend
call npm install --omit=dev

echo [2/4] 构建前端...
cd ../frontend
call npm install
call npm run build

echo [3/4] 检查题库...
cd ../backend
node -e "const {initDb}=require('./src/utils/initDb');initDb().then(()=>{const q=require('./src/config/db');const c=q.queryOne('SELECT COUNT(*) as count FROM problems').count;if(c===0){console.log('生成题库中...');require('./src/utils/seedLarge')}else{console.log('题库已就绪 ('+c+' 题)')}})"

echo [4/4] 启动服务器...
node src/app.js
pause
