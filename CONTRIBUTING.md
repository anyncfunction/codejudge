# 贡献指南

感谢你对 CodeJudge 的关注！以下是一些贡献指南。

## 如何贡献

### 报告 Bug
- 在 GitHub Issues 中提交
- 请详细描述问题、复现步骤和环境

### 提交 Pull Request
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交修改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范
- 前端使用 TypeScript，严格模式
- 后端使用 CommonJS 模块
- 提交信息遵循 conventional commits
- 新增 API 需添加测试

### 本地开发
```bash
# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动开发环境
cd backend && npm run dev   # 后端 :3001
cd frontend && npm run dev  # 前端 :5173

# 运行测试
cd backend && npm test
```
