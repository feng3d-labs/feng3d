# Feng3D 模块库迁移计划

## Context

当前 feng3d monorepo 仅包含 `@feng3d/webgpu` 和 `gpu-driven-rendering`。需要将历史版本 0.8.0 中的模块库迁移到 packages 中，以便统一管理和发布。

这些模块库分散在：
- https://gitee.com/feng3d
- https://github.com/feng3d-labs

**目标：** 统一到 monorepo，便于版本管理和依赖同步。

## 用户决策

- **迁移策略：** 按需迁移 - 根据当前项目需要，优先迁移正在使用的模块
- **外部依赖：** @feng3d/reactivity 和 @feng3d/watcher 也要迁移到 monorepo
- **源仓库：** 保留原仓库，添加 README 指向新 monorepo
- **重构：** 部分模块迁移后还需要重构

## 需要迁移的模块

| 模块名 | 状态 | 优先级 | 说明 |
|--------|------|--------|------|
| @feng3d/reactivity | 使用中 | **高** | 当前依赖 1.0.12，需迁移 |
| @feng3d/watcher | 使用中 | **高** | 当前依赖 0.8.14，需迁移 |
| @feng3d/event | 待定 | 中 | 事件系统 |
| @feng3d/math | 待定 | 中 | 数学库 |
| @feng3d/core | 待定 | 中 | 核心库 |
| @feng3d/serialization | 待定 | 低 | 序列化 |
| @feng3d/bezier | 待定 | 低 | 贝塞尔曲线 |
| @feng3d/objectview | 待定 | 低 | 对象视图，已有 Vue 示例在 src/objectview |
| @feng3d/polyfill | 待定 | 低 | Polyfill |
| @feng3d/task | 待定 | 低 | 任务系统 |
| @feng3d/filesystem | 待定 | 低 | 文件系统 |
| @feng3d/shortcut | 待定 | 低 | 快捷键 |
| @feng3d/renderer | 待定 | 低 | 渲染器 |
| @feng3d/terrain | 待定 | 低 | 地形 |
| @feng3d/particlesystem | 待定 | 低 | 粒子系统 |
| @feng3d/assets | 待定 | 低 | 资源管理 |
| @feng3d/parsers | 待定 | 低 | 解析器 |
| @feng3d/ui | 待定 | 低 | UI组件 |

## 单个模块迁移流程

### 1. 准备
```bash
# 克隆源仓库
git clone <source-repo> /tmp/<module-name>
```

### 2. 清理和重组
- 移除 `.git`, `node_modules`, `dist`, `lib` 等
- 调整目录结构: `src/`, `test/`, `examples/`
- 更新 `package.json`:
  ```json
  {
    "name": "@feng3d/<module-name>",
    "version": "0.0.1",
    "private": false,
    "type": "module",
    "scripts": {
      "clean": "rimraf lib dist public",
      "build": "tsc && vite build",
      "watch": "tsc --watch",
      "test": "vitest"
    }
  }
  ```
- 更新内部依赖为 workspace 协议: `"@feng3d/xxx": "*"`

### 3. 创建 tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "lib", "public", "examples"]
}
```

### 4. 移动到 packages
```bash
mv /tmp/<module-name> packages/<module-name>
cd packages/<module-name>
npm install
```

### 5. 验证
```bash
npm run build -w @feng3d/<module>
npm run test -w @feng3d/<module>
npm run types
npm run lint
```

### 6. 更新源仓库
在原仓库添加 README:
```markdown
# ⚠️ 已迁移

此项目已迁移到 [feng3d/monorepo](https://gitee.com/feng3d/feng3d/tree/master/packages/<module-name>)

请更新依赖到 monorepo 版本。
```

### 7. 提交
```bash
git add packages/<module-name>
git commit -m "feat: migrate @feng3d/<module> to monorepo"
```

## 当前目录结构

```
feng3d/
├── packages/
│   ├── webgpu/              # 已有
│   ├── webgpu-examples/     # 已有
│   └── gpu-driven-rendering/ # 已有
├── package.json             # workspace 配置
├── tsconfig.json            # 根 TS 配置
├── eslint.config.js         # ESLint 配置
└── MIGRATION_PLAN.md        # 本文件
```

## 迁移顺序建议（按需）

1. **@feng3d/watcher** - webgpu 当前依赖
2. **@feng3d/reactivity** - webgpu 当前依赖
3. 其他模块根据实际需要逐步迁移

## 关键文件

- `package.json` - 根 workspace 配置
- `tsconfig.json` - 根 TypeScript 配置 (noEmit: true)
- `eslint.config.js` - ESLint flat config
- `packages/*/package.json` - 子包配置
- `packages/*/tsconfig.json` - 子包 TS 配置

## 验证检查清单

- [ ] 模块可以正常构建
- [ ] 模块可以正常测试
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 依赖关系正确（使用 workspace 协议）
- [ ] 原仓库 README 已更新

## 迁移记录

> ⚠️ 迁移记录请查看主 README.md 的 [迁移记录](README.md#迁移记录) 部分，本文件仅保留迁移流程说明。
