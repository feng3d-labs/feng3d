# Feng3D Web3D Engine

Feng3D 是一个基于 WebGPU 的 Web 3D 引擎 monorepo，统一管理所有 @feng3d/* 模块。

> 📋 **模块迁移进度见下方 [Packages](#packages) 部分**

## 📦 Packages

### 已集成

| 包名 | 描述 | 状态 | 版本 |
|------|------|------|------|
| [@feng3d/webgpu](packages/webgpu/) | WebGPU 渲染后端 | ✅ 稳定 | 0.1.0 |
| [@feng3d/webgpu-examples](packages/webgpu/examples/) | WebGPU 示例集合 | ✅ 稳定 | 0.0.1 |
| [@feng3d/watcher](packages/watcher/) | 对象属性监听器 | ✅ 稳定 | 0.8.14 |
| [@feng3d/reactivity](packages/reactivity/) | 响应式系统 | ✅ 稳定 | 1.0.12 |
| [gpu-driven-rendering](packages/gpu-driven-rendering/) | GPU 驱动渲染文档 | 📄 文档 | - |

### 待迁移

| 包名 | 描述 | 优先级 | 源仓库 | 状态 |
|------|------|--------|--------|------|
| @feng3d/event | 事件系统 | 🟡 中 | ? | ⏳ 待迁移 |
| @feng3d/event | 事件系统 | 🟡 中 | ? | ⏳ 待迁移 |
| @feng3d/math | 数学库（向量、矩阵等） | 🟡 中 | ? | ⏳ 待迁移 |
| @feng3d/core | 核心库 | 🟡 中 | ? | ⏳ 待迁移 |
| @feng3d/serialization | 序列化/反序列化 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/bezier | 贝塞尔曲线 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/objectview | 对象视图/调试工具 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/polyfill | 浏览器 Polyfill | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/task | 任务系统 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/filesystem | 虚拟文件系统 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/shortcut | 快捷键管理 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/renderer | 渲染器抽象层 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/terrain | 地形系统 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/particlesystem | 粒子系统 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/assets | 资源管理 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/parsers | 模型/场景解析器 | 🟢 低 | ? | ⏳ 待迁移 |
| @feng3d/ui | UI 组件 | 🟢 低 | ? | ⏳ 待迁移 |

> 图例：✅ 稳定 | 🔄 迁移中 | ⏳ 待迁移 | 🔴 高优先级 | 🟡 中优先级 | 🟢 低优先级

---

## 🚀 快速开始（用户）

### 安装

```bash
# 安装 WebGPU 包
npm install @feng3d/webgpu
```

### 基础示例

```typescript
import { WebGPU } from '@feng3d/webgpu';

const gpu = await WebGPU.create();
// ...
```

查看 [examples](packages/webgpu/examples/) 获取更多示例。

---

## 👨‍💻 开发指南（开发者）

### 环境要求

- Node.js >= 18
- npm >= 9
- 支持 WebGPU 的浏览器

### 克隆项目

```bash
git clone https://gitee.com/feng3d/feng3d.git
cd feng3d
```

### 安装依赖

```bash
npm install
```

### 常用命令

```bash
# 构建所有包
npm run build

# 监听模式构建
npm run build:watch

# 运行测试
npm run test

# TypeScript 类型检查
npm run types

# 代码检查
npm run lint

# 自动修复代码风格
npm run lintfix

# 生成文档
npm run docs

# 清理所有构建产物
npm run clean

# 完全清理（包括 git 忽略的文件）
npm run clean:all
```

### 运行示例

```bash
# WebGPU 示例
npm run dev -w @feng3d/webgpu-examples
```

访问 http://localhost:5173

### 添加新包

```bash
# 在 packages/ 下创建新包
mkdir packages/<package-name>
cd packages/<package-name>

# 初始化 package.json
npm init

# 按照现有包的结构组织：
# src/       # 源代码
# test/      # 测试
# examples/  # 示例（可选）
```

### 发布流程

```bash
# 更新版本
npm run release

# 发布到 npm（从根目录）
npm publish -w <package-name>
```

---

## 🏗️ Monorepo 结构

```
feng3d/
├── packages/                    # 所有子包
│   ├── webgpu/                 # WebGPU 渲染库
│   │   ├── src/
│   │   ├── test/
│   │   └── package.json
│   ├── webgpu-examples/        # 示例应用
│   │   ├── src/
│   │   ├── resources/
│   │   └── vite.config.ts
│   └── gpu-driven-rendering/   # 文档项目
├── package.json                # 根 workspace 配置
├── tsconfig.json               # 根 TypeScript 配置
├── eslint.config.js            # ESLint 配置
├── MIGRATION_PLAN.md           # 模块迁移计划
└── README.md                   # 本文件
```

### 配置说明

- **package.json** - npm workspaces 配置，定义所有子包
- **tsconfig.json** - 根 TS 配置（noEmit: true），子包继承此配置
- **eslint.config.js** - ESLint v10 flat config，统一代码风格

---

## 📝 迁移记录

| 日期 | 包名 | 操作 | 备注 |
|------|------|------|------|
| 2024-04 | webgpu | ✅ 已集成 | 初始 monorepo |
| 2024-04 | webgpu-examples | ✅ 已集成 | 从 webgpu 分离 |
| 2026-04-21 | watcher | ✅ 已集成 | 从 gitee 迁移 v0.8.14 |
| 2026-04-21 | reactivity | ✅ 已集成 | 从 github 迁移 v1.0.12 |

详细迁移计划见 [MIGRATION_PLAN.md](MIGRATION_PLAN.md)

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 编写
- 遵循 ESLint 规则
- 添加单元测试
- 更新文档

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- [WebGPU Samples](https://github.com/webgpu/webgpu-samples)
- [Gitee 仓库](https://gitee.com/feng3d/feng3d)
