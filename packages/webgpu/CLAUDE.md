# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`@feng3d/webgpu` 是 feng3d 引擎的 WebGPU 渲染后端库，提供 WebGPU API 的 TypeScript 封装和响应式对象系统，支持高性能 GPU 渲染和计算。

**子模块**：
- `packages/tsl` - 着色器语言库（TypeScript to WGSL）
- `packages/render-api` - 渲染 API 抽象层

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式（运行示例）
npm run examples:dev

# 开发模式（运行测试网页）
npm run test_web

# 构建
npm run build

# 监听模式构建
npm run watch

# 运行测试
npm run test

# 代码检查
npm run lint

# 自动修复代码格式
npm run lintfix

# 生成文档
npm run docs

# 清理构建产物
npm run clean

# 发布（完整流程）
npm run release
```

## 架构概览

### 项目结构

```
src/
├── caches/         # WebGPU 对象缓存（Buffer, Texture, Pipeline 等）
├── data/           # 数据结构和 polyfills
│   └── polyfills/  # WebAPI polyfills
├── internal/       # 内部渲染逻辑
│   └── renderobject/ # 渲染对象执行器
├── types/          # 类型定义
├── utils/          # 工具函数
├── ReactiveObject.ts
├── index.ts
└── WebGPU.ts
```

### 核心 API

**WebGPU 上下文**：`WebGPU` - 主入口类

**缓存系统**：
- `WGPUBuffer` - GPU 缓冲区
- `WGPUTexture` - GPU 纹理
- `WGPUSampler` - 采样器
- `WGPURenderPipeline` - 渲染管线
- `WGPUComputePipeline` - 计算管线
- `WGPUBindGroup` - 绑定组
- `WGPUBindGroupLayout` - 绑定组布局

**渲染对象**：
- `RenderObject` - 渲染对象抽象
- `ComputeObject` - 计算对象
- `RenderPass` - 渲染通道
- `ComputePass` - 计算通道

**响应式系统**：`ReactiveObject` - 响应式对象基类

### 渲染流程

1. 创建 WebGPU 设备 (`WebGPU` 类)
2. 创建缓存对象（Buffer, Texture, Sampler 等）
3. 创建管线（RenderPipeline 或 ComputePipeline）
4. 创建渲染对象并执行渲染

### 关键文件

- `src/WebGPU.ts` - WebGPU 主入口类
- `src/ReactiveObject.ts` - 响应式对象基类
- `src/caches/` - WebGPU 对象缓存实现
- `src/internal/` - 内部渲染逻辑

## 开发约定

### TypeScript 规范

- **严格模式**：项目使用 `strict: true` 的 TypeScript 配置
- **类型导出**：公共 API 必须导出类型定义
- **命名规范**：
  - 类：帕斯卡（PascalCase）
  - 函数：小驼峰（camelCase）
  - 类型/接口：帕斯卡（PascalCase）
  - 常量：大写下划线（UPPER_SNAKE_CASE）
- **避免 any**：公共 API 不使用 `any` 类型

### Git 提交规范

- 使用简体中文
- 遵循约定式提交格式：`<类型>(<范围>): <简短描述>`
- 类型：feat/fix/refactor/perf/style/docs/test/chore/build/ci

### 测试规范

- 测试文件位于 `test/` 目录
- 使用 Vitest 框架
- 公共 API 变更必须添加或更新测试

### 文档同步规范（强制遵守）

**重要：任何功能新增、修改或删除，必须同步更新 `docs/` 中的文档。**

#### 工作流程

1. **文档优先原则**（推荐）
   - 先在 `docs/` 中创建或更新相关文档
   - 按照文档描述进行代码实现
   - 实现完成后验证文档与代码一致

2. **代码优先原则**（允许）
   - 先完成代码实现
   - 立即更新相关文档
   - 提交前确保文档与代码同步

#### 同步要求

| 操作 | 文档要求 |
|------|---------|
| 新增 API | 在对应文档中添加 API 说明 |
| 新增类型 | 在类型文档中添加类型说明 |
| 新增功能 | 在对应文档中添加功能说明 |
| 修改 API | 更新文档中的说明 |
| 删除 API | 从文档中移除相关说明 |
| 架构变更 | 更新架构文档 |

## 依赖说明

### 运行时依赖

- `@feng3d/reactivity` - 响应式系统
- `@feng3d/render-api` - 渲染 API 抽象层
- `@feng3d/watcher` - 监听器
- `@webgpu/types` - WebGPU 类型定义
- `wgsl_reflect` - WGSL 反射

### 开发依赖

- `typescript` - 类型检查和编译
- `vite` - 构建工具
- `vitest` - 测试框架
- `eslint` - 代码检查
- `typedoc` - 文档生成
- `husky` - Git hooks
- `lint-staged` - 暂存文件检查

## 工作流选择（自动判断）

根据任务类型自动选择合适的工作流：

### 工作流对照表

| 任务特征 | 使用工作流 | 命令/触发 |
|---------|-----------|----------|
| 添加单个缓存类型 | Superpowers | 直接描述需求 |
| 修复 bug | Superpowers + systematic-debugging | 直接描述问题 |
| 简单重构 | Superpowers | 直接描述需求 |
| 大型功能（5+ 文件） | OpenSpec | `/opsx:propose` |
| 架构变更 | OpenSpec | `/opsx:propose` |
| 需要设计文档 | OpenSpec | `/opsx:propose` |
| 新增子系统 | OpenSpec | `/opsx:propose` |

### Superpowers 工作流

```
brainstorming → writing-plans → subagent-driven-development → code-review → finishing
```

**适用场景**：
- 添加新的 WebGPU 缓存类型
- 修复渲染问题
- 优化现有实现
- 补充测试

**触发方式**：直接描述需求，Superpowers 技能会自动激活

### OpenSpec 工作流

```
/opsx:propose → /opsx:apply → /opsx:archive
```

**适用场景**：
- 重构缓存系统
- 添加新的渲染通道类型
- 重构核心渲染流程
- 新增计算管线支持

**命令**：
- `/opsx:propose <描述>` — 创建提案并生成 artifacts
- `/opsx:apply` — 按任务清单实现
- `/opsx:archive` — 归档变更
- `/opsx:explore` — 需求不明确时探索

### 自动判断规则

**AI 助手在接收到任务时应先判断**：

1. **任务规模**：涉及文件数量 > 5？→ OpenSpec
2. **架构影响**：是否改变核心设计？→ OpenSpec
3. **文档需求**：是否需要长期维护的设计文档？→ OpenSpec
4. **以上皆否** → Superpowers

## 开发环境准备

**首次打开项目时，Claude Code 必须主动检查以下工具和插件是否已安装。**

### 必需：工具和插件

```bash
# OpenSpec CLI（大型任务使用）
npm install -g openspec

# Superpowers 插件（日常开发使用）
claude plugin marketplace add obra/superpowers-marketplace
claude plugin install superpowers@superpowers-marketplace
```

> **注意**：OpenSpec 的命令和技能已全局安装，每个项目只需配置 `openspec/config.yaml` 即可使用。

### 推荐：其他插件

| 插件 | 安装命令 | 说明 |
|------|---------|------|
| code-simplifier | `claude plugin install code-simplifier` | 代码简化与重构 |
| typescript-lsp | `claude plugin install typescript-lsp` | TypeScript 语言服务 |
| commit-commands | `claude plugin install commit-commands` | Git 提交工具（`/commit`） |

## 调试技巧

### 查看渲染状态

```typescript
// 开发时打印渲染信息
console.log('Pipeline:', pipeline);
console.log('BindGroups:', bindGroups);
```

### 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 渲染黑屏 | 管线未绑定或 shader 未编译 | 检查 pipeline 创建状态 |
| 纹理显示错误 | 纹理格式不匹配 | 检查纹理格式与视图格式 |
| buffer 数据未更新 | 未调用 writeBuffer 或 mapAsync | 检查 buffer 更新逻辑 |
| 编译错误 | WGSL 语法错误 | 使用 wgsl_reflect 检查 |

### 开发模式调试

```typescript
// 开发时打印状态
console.log('Device:', webgpu.device);
console.log('Context:', webgpu.context);
```

## 发布流程

1. 更新 `package.json` 中的版本号
2. 运行 `npm run build` 确保构建成功
3. 运行 `npm test` 确保测试通过
4. 运行 `npm publish` 发布到 npm
