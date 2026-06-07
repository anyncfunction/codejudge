<div align="center">

# CodeJudge - 在线评测系统

[![GitHub stars](https://img.shields.io/github/stars/anyncfunction/codejudge?style=flat-square&logo=github)](https://github.com/anyncfunction/codejudge)
[![GitHub license](https://img.shields.io/github/license/anyncfunction/codejudge?style=flat-square)](https://github.com/anyncfunction/codejudge/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

一个现代化在线评测平台，支持 **JavaScript / Python / C++** 三种编程语言，**自带 10000 道预置题目**（编程/选择/填空），对标 LeetCode 式体验。

</div>

## 特性

- **三种题型** — 编程题（在线编写代码运行判题）、选择题（选项匹配评分）、填空题（文本匹配判题）
- **多语言支持** — 支持 JavaScript、Python、C++（沙箱执行 + 8 秒超时）
- **自带题库** — 首次启动自动生成 10000 道题目（3500 编程 + 3500 选择 + 3000 填空）
- **Markdown 题目** — 题目描述支持完整 Markdown 渲染（表格、代码块等）
- **用户系统** — JWT 认证，支持管理员/普通用户角色
- **深色 UI** — 基于 Tailwind CSS 的暗色主题，Monaco Editor 代码编辑器
- **判题详情** — 编程题按测试用例展示通过/失败，选择题显示正确答案
- **成就系统** — 解题打卡、徽章解锁、排行榜、个人数据统计
- **快捷键** — 支持快捷键导航（H 首页/G 题库/U 随机未做/Ctrl+K 搜索）

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

> ⚠️ **新手体验指南** — 以下教程仅适用于 Windows 10/11 下的快速体验，**请勿在生产环境使用**。如有生产需求，请使用 Linux 服务器部署。

### 🐳 Windows Docker 部署（推荐，零配置）

```bash
# 请选择磁盘富余的位置，打开 PowerShell 运行：
git clone https://github.com/anyncfunction/codejudge.git
cd codejudge
docker compose up -d
```

> 根据网速，首次运行会自动下载依赖镜像，大约 5~30 分钟。
> 等命令执行完，运行 `docker ps -a`，所有容器状态无 `unhealthy` 即启动成功。
> 访问 http://localhost:3001

### 💻 本地开发部署

```bash
# 克隆项目
git clone https://github.com/anyncfunction/codejudge.git
cd codejudge
```

> 如果网络不稳定，可使用镜像加速：`git clone https://hub.fastgit.xyz/anyncfunction/codejudge.git`

#### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

#### 启动

```bash
# 开发模式（前后端分离，推荐）
cd backend
npm start          # 后端 http://localhost:3001
# 新开终端，回到项目根目录后：
cd frontend
npm run dev        # 前端 http://localhost:5173（自动代理 /api 到后端）

# 生产模式（后端托管前端构建产物）
cd backend
npm start          # 访问 http://localhost:3001
```

#### 构建前端（可选）

```bash
cd frontend
npm run build      # 输出到 dist/，后端自动托管
```

## 预置账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@oj.com | admin123 |
| 学生 | test@oj.com | test123 |

> 也支持通过注册页面自行创建学生账户。

## 预置题目

系统内置 **10000 道预置题目**（编程 3500 + 选择 3500 + 填空 3000），涵盖多种难度和标签。

首次启动数据库为空时自动生成，或手动执行：

```bash
cd backend
node src/utils/seedLarge.js
```

此外，系统初始化还会自动创建 6 道示例题目作为基础演示：

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
