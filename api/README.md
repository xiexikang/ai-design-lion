# AI Design Backend API

AI设计工具后端服务，提供用户认证、项目管理、图片生成等功能。

## 功能特性

- 用户注册和登录（JWT认证）
- 项目管理（创建、编辑、删除）
- 图片生成（支持七牛云AI API）
- 批量图片生成
- 图片编辑（图生图）
- 图片存储和管理

## 技术栈

- Go 1.21+
- Gin Web框架
- GORM ORM
- SQLite数据库
- JWT认证
- 七牛云AI API集成

## 安装和运行

### 1. 安装依赖

```bash
cd api
go mod download
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
PORT=8080
JWT_SECRET=your-jwt-secret-key
QINIU_API_KEY=your-qiniu-api-key
QINIU_BASE_URL=https://api.qnaigc.com/v1
ENVIRONMENT=development
```

### 3. 运行服务

```bash
go run main.go
```

服务将在 http://localhost:8080 启动

## API文档

### 认证相关

#### 注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

#### 登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 图片生成

#### 生成单张图片
```http
POST /api/v1/generate/image
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "a beautiful sunset over the ocean",
  "model": "gemini-2.5-flash-image",
  "size": "1024x1024",
  "project_id": "project-uuid"
}
```

#### 批量生成图片
```http
POST /api/v1/generate/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompts": [
    "scene 1: opening shot",
    "scene 2: character introduction",
    "scene 3: climax moment"
  ],
  "model": "gemini-2.5-flash-image",
  "project_id": "project-uuid"
}
```

#### 图片编辑（图生图）
```http
POST /api/v1/generate/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "base64-encoded-image-data",
  "prompt": "add sunset colors to the sky",
  "model": "gemini-2.5-flash-image"
}
```

### 项目管理

#### 获取项目列表
```http
GET /api/v1/projects
Authorization: Bearer <token>
```

#### 创建项目
```http
POST /api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Design Project",
  "description": "A collection of AI generated images",
  "type": "single"
}
```

### 图片管理

#### 获取图片列表
```http
GET /api/v1/images?project_id=<project-id>
Authorization: Bearer <token>
```

#### 下载图片
```http
GET /api/v1/images/<image-id>/download
Authorization: Bearer <token>
```

## 数据库结构

### 用户表 (users)
- id: UUID主键
- email: 邮箱地址
- username: 用户名
- password: 密码（应加密存储）
- avatar: 头像URL
- is_active: 是否激活
- created_at: 创建时间
- updated_at: 更新时间

### 项目表 (projects)
- id: UUID主键
- user_id: 用户ID（外键）
- title: 项目标题
- description: 项目描述
- type: 项目类型（single/storyboard）
- status: 项目状态
- created_at: 创建时间
- updated_at: 更新时间

### 图片表 (images)
- id: UUID主键
- project_id: 项目ID（外键）
- prompt: 生成提示词
- model: 使用的模型
- size: 图片尺寸
- image_url: 图片URL
- image_data: 图片数据（Base64）
- status: 生成状态
- error: 错误信息
- generated_at: 生成时间
- created_at: 创建时间
- updated_at: 更新时间

## 开发说明

### 添加新功能
1. 在 `models/` 目录下定义数据模型
2. 在 `handlers/` 目录下创建处理器函数
3. 在 `routes/routes.go` 中添加路由
4. 更新数据库迁移（如需要）

### 错误处理
所有处理器都应该返回适当的HTTP状态码和错误信息：
- 400: 请求参数错误
- 401: 未授权
- 404: 资源未找到
- 500: 服务器内部错误

### 安全性
- 所有需要认证的API都需要JWT token
- 用户只能访问自己的数据
- 敏感数据应该加密存储