# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

feng3d-editor 是一个基于 feng3d 3D 引擎的可视化编辑器，使用 Vue 3 + TypeScript + Vite 构建。编辑器采用混合架构：Vue 3 负责现代 UI 组件，传统的 TypeScript 模块负责核心编辑器逻辑。

## 常用命令

```bash
# 开发（使用 npm，pnpm 会导致发布失败）
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 自动修复代码格式
npm run lintfix

# 清理构建产物
npm run clean
```

## 架构概览

### 双架构设计

项目采用**传统 UI + Vue UI** 混合架构：

1. **传统 UI 层** ([src/ui/](src/ui))
   - 早期基于自定义系统的 UI 组件
   - 包括 hierarchy（层级树）、inspector（属性检查器）、assets（资源管理）
   - 直接操作 DOM，不使用 Vue

2. **Vue UI 层** ([src/vue-app/](src/vue-app))
   - 基于 Vue 3 + Element Plus 的新 UI 系统
   - 使用组合式 API（Composables）
   - 与传统 UI 共享状态和事件系统

### 核心模块

- **Editor.ts** - 编辑器主入口，负责初始化各层和模块
- **Modules.ts** - 模块管理器，维护编辑器各功能模块的引用
- **EditorData** - 全局编辑器数据，存储当前场景、选中对象等状态
- **editorui** ([src/global/editorui](src/global/editorui)) - UI 层管理器
- **editorRS** / **editorcache** - 资源系统和缓存管理

### Packages 工作区

项目使用 npm workspaces 管理子包：
- `packages/cannon` - Cannon.js 物理引擎集成
- `packages/cannon-plugin` - 物理插件
- `packages/themes` - 主题系统
- `packages/objectview` - 对象视图组件
- `packages/codeeditor` - 代码编辑器
- `packages/typescript` - TypeScript 支持

### 构建配置

- **多入口构建**：index.html（编辑器主界面）、run.html（运行预览）
- **外部依赖**：feng3d 及相关插件通过 CDN 加载，不打包进 bundle
- **静态资源**：resource/ 目录在构建时复制到 public/

## 代码规范

### Git 提交规范
- 使用简体中文
- 遵循约定式提交格式：`<类型>(<范围>): <简短描述>`
- 类型：feat/fix/refactor/perf/style/docs/test/chore/build/ci

### Vue 组件规范
- **逻辑抽离**：.vue 文件只保留 template，TypeScript 逻辑抽离到同名 .ts 文件
- **样式抽离**：CSS 放在 `styles/` 目录独立文件
- **组合式函数**：使用 `useXxx` 命名的 composables 封装逻辑

### Vue 响应式对象规范
- **响应式对象命名必须以 `r_` 开头**，如 `r_owner`、`r_value`
- **不要传递响应式对象到函数参数**中
- **不要导出响应式对象**
- 仅在需要 computed/watch 时使用响应式对象
- 响应式对象应在组件或 composable 内部创建

### TypeScript 规范
- 使用驼峰命名（camelCase）变量和函数
- 使用帕斯卡命名（PascalCase）类和接口
- 避免使用 `any` 类型（虽 eslint 规则允许，但代码规范不建议）
- 公共 API 必须添加 JSDoc 注释
- 复杂逻辑必须添加中文注释

### 配置文件结构
vite.config.js 等配置文件按以下顺序组织：
1. 文件头部：导入语句、配置变量
2. 主要执行逻辑（export default）
3. 文件尾部：辅助函数定义

### 模块组织
- 优先使用命名导出，避免默认导出
- 避免不必要的导出
- 每个文件不超过 300 行代码
- 相关功能组织在同一目录下

## 开发注意事项

1. **依赖安装**：必须使用 `npm i`，pnpm 会导致发布失败
2. **外部依赖**：feng3d 等核心库不打包，通过 CDN 加载
3. **类名保持**：esbuild 配置 keepNames 避免类名被修改
4. **lint 检查**：提交前必须通过 lint 检查（max-warnings 0）
5. **右键菜单**：编辑器禁用了默认右键菜单
