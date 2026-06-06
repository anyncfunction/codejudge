# CodeJudge - 在线评测系统

一个现代化在线评测平台，支持**编程题**、**选择题**、**填空题**三种题型，对标 LeetCode 式体验。

## 特性

- **三种题型** — 编程题（在线编写代码运行判题）、选择题（选项匹配评分）、填空题（文本匹配判题）
- **代码在线运行** — 支持 JavaScript 和 Python，沙箱执行 + 超时控制
- **Markdown 题目** — 题目描述支持完整 Markdown 渲染（表格、代码块等）
- **用户系统** — JWT 认证，管理员可创建/编辑/删除题目
- **深色 UI** — 基于 Tailwind CSS 的暗色主题，Monaco Editor 代码编辑器
- **判题详情** — 编程题按测试用例展示通过/失败，选择题显示正确答案

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 编辑器 | Monaco Editor (`@monaco-editor/react`) |
| 后端 | Node.js + Express |
| 数据库 | SQLite（sql.js，纯 WASM，零安装） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |
| 判题 | Node.js child_process 沙箱执行 |

## 项目结构

```
onlinejudge/
├── backend/
│   └── src/
│       ├── controllers/     # auth, problem, submission
│       ├── services/        # judgeService (代码/选择/填空)
│       ├── middleware/       # JWT 认证
│       ├── routes/           # RESTful API
│       └── utils/            # 数据库初始化 + 种子数据
├── frontend/
│   └── src/
│       ├── components/       # Navbar, CodeEditor, ProblemCard, MarkdownRenderer...
│       ├── pages/            # Home, Login, Register, Problems, ProblemDetail, Admin...
│       ├── context/          # AuthContext (JWT 状态管理)
│       └── services/         # API 调用层
```

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 启动

```bash
# 生产模式（后端同时托管前端）
cd backend
npm start
# 访问 http://localhost:3001

# 开发模式（前后端分离，支持热更新）
cd backend && npm run dev    # 后端 :3001
cd frontend && npm run dev   # 前端 :5173（自动代理 API）
```

### 3. 构建前端

```bash
cd frontend
npm run build    # 输出到 dist/，后端自动托管
```

### 4. Docker 部署

```bash
docker compose up -d    # 一键启动
# 访问 http://localhost:3001
```

## 预置账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@oj.com | admin123 |
| 学生 | test@oj.com | test123 |

> 也支持通过注册页面自行创建学生账户。

## 预置题目

系统初始化时会自动创建 6 道示例题目（3 编程 + 2 选择 + 1 填空），涵盖：

- 两数之和、反转字符串、斐波那契数列（编程）
- HTTP 状态码、SQL 查询（选择）
- JavaScript typeof null（填空）

## API 概要

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/profile` | 获取用户信息 |
| GET | `/api/problems` | 题目列表（支持筛选/搜索/分页） |
| GET | `/api/problems/:id` | 题目详情 |
| GET | `/api/problems/stats` | 题目统计 |
| GET | `/api/problems/templates/:lang` | 代码模板 |
| POST | `/api/problems` | 创建题目（管理员） |
| PUT | `/api/problems/:id` | 编辑题目（管理员） |
| DELETE | `/api/problems/:id` | 删除题目（管理员） |
| POST | `/api/submissions` | 提交答案 |
| GET | `/api/submissions` | 提交记录 |

## License

MIT
