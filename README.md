# AI设计狮（AI Design Lion）

一个用于图像与视觉设计创作的全栈项目。前端基于 React + Vite + TypeScript，后端使用 Go + Gin 提供用户认证、项目与图片管理，以及对第三方 AI 图片服务（七牛云 QNAIGC）的直连或代理。

## 功能特性

- 文生图、图生图与批量生成（故事板）
- 项目与图片管理：创建、查询、删除、下载
- 本地加密保存七牛云 API Key（前端设置面板）
- JWT 认证与受保护的后端接口（暂不需要）
- Vercel 前端部署与后端 API 重写支持

## 技术栈

- 前端：React 18、TypeScript、Vite、Tailwind CSS、Zustand、Lucide Icons
- 后端：Go 1.23、Gin、JWT、内存存储（可扩展至 GORM/SQLite）
- 第三方：七牛云 AI 图片生成 API（直连或后端代理）

## 目录结构

- `src/` 前端源代码（画布、聊天面板、服务封装等）
- `api/` 后端服务（Gin 路由、处理器、内存存储、配置）
- `tailwind.config.js` Tailwind 配置

## 快速开始

### 前置要求

- Node.js 18+（推荐包管理器：`pnpm`）
- Go 1.23+

### 安装依赖

```bash
pnpm install
```

### 启动后端

```bash
cd api
go run main.go
```

默认监听 `http://localhost:8080`，API 前缀为 `/api/v1`。

后端环境变量（在 `api/.env`）示例：

```env
PORT=8080
JWT_SECRET=your-jwt-secret-key
QINIU_API_KEY=your-qiniu-api-key
QINIU_BASE_URL=https://api.qnaigc.com/v1
ENVIRONMENT=development
# 可选：允许跨域来源，默认为本地端口通配
ALLOWED_ORIGINS=http://localhost:6688
```

### 启动前端

```bash
pnpm dev
```

开发服务器默认在 `http://localhost:6688`。

前端环境变量（在项目根目录 `.env`）可选：

```env
# 后端 API 基地址（用于项目/图片管理与认证）
VITE_API_BASE_URL=http://localhost:8080/api/v1

# 七牛云直连地址（用于生成与编辑）
VITE_QINIU_BASE_URL=https://api.qnaigc.com/v1
```

首次进入页面会弹出“设置七牛云密钥”的对话框，按提示保存 Key 后即可进行生成；也可随时在设置面板中更新。

## 常用命令

- `pnpm dev` 本地开发
- `pnpm build` 构建产物
- `pnpm preview` 预览构建产物
- `pnpm lint` 代码检查（ESLint）
- `pnpm check` 类型检查（TypeScript）

## 后端 API 摘要

详细接口与示例请查看 `api/README.md`。

- 认证：`POST /api/v1/auth/register`，`POST /api/v1/auth/login`
- 项目：`GET/POST/PUT/DELETE /api/v1/projects` 与 `GET /api/v1/projects/:id`
- 图片生成：
  - 文生图：`POST /api/v1/generate/image`
  - 批量生成：`POST /api/v1/generate/batch`
  - 图生图：`POST /api/v1/generate/edit`
- 图片管理：`GET /api/v1/images`，`GET /api/v1/images/:id`，`DELETE /api/v1/images/:id`，`GET /api/v1/images/:id/download`

> 提示：前端也支持直接调用七牛云接口（`src/services/api.service.ts`），或通过后端代理（`/api/v1/proxy/*`）。

## 部署与重写

- 前端可部署到 Vercel，`vercel.json` 已配置将 `/api/*` 重写到后端：

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://111.230.175.125:8080/api/v1/:path*" }
  ]
}
```

- 生产环境建议：
  - 使用真实数据库与持久化存储
  - 配置 `ALLOWED_ORIGINS` 与 `JWT_SECRET`
  - 将七牛云 Key 以安全方式下发或使用后端代理

## 参考代码位置

- 后端入口：`api/main.go`
- 路由配置：`api/routes/routes.go`
- CORS 中间件与配置：`api/config/config.go`
- 前端 API 封装（后端）：`src/services/backend.service.ts`
- 前端七牛云服务：`src/services/api.service.ts`
- 画布与界面：`src/components/Canvas.tsx`，`src/components/ChatPanel.tsx`

## 许可证 License

This project is licensed under the MIT License.
