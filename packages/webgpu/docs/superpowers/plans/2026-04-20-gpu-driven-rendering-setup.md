# @feng3d/gpu-driven-rendering 子项目结构搭建

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 `@feng3d/gpu-driven-rendering` 独立子项目的基础结构，配置构建环境，建立与主项目的 workspace 依赖关系

**Architecture:** 独立 npm 包，通过 workspace 协议依赖 `@feng3d/webgpu:*`，开发时链接本地版本，发布时使用版本号

**Tech Stack:** TypeScript, Vite, Vitest, ESLint, npm workspaces

---

## 文件结构概览

```
gpu-driven-rendering/
├── package.json                   # 包配置
├── tsconfig.json                  # TS配置
├── vite.config.ts                 # Vite配置
├── .eslintrc.json                 # ESLint配置
├── src/
│   └── index.ts                   # 主入口（导出占位）
├── examples/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/main.ts
│   └── public/index.html
└── test/
    └── placeholder.test.ts
```

根项目 `package.json` 需要添加 workspace 引用。

---

## Task 1: 创建子项目 package.json

**Files:**
- Create: `gpu-driven-rendering/package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@feng3d/gpu-driven-rendering",
  "version": "0.1.0",
  "description": "WebGPU 全GPU驱动渲染系统",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "module": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "require": "./src/index.ts"
    },
    "./core": {
      "types": "./src/core/index.ts",
      "import": "./src/core/index.ts"
    },
    "./culling": {
      "types": "./src/culling/index.ts",
      "import": "./src/culling/index.ts"
    },
    "./lod": {
      "types": "./src/lod/index.ts",
      "import": "./src/lod/index.ts"
    },
    "./transparent": {
      "types": "./src/transparent/index.ts",
      "import": "./src/transparent/index.ts"
    }
  },
  "scripts": {
    "dev": "cd examples && npm run dev",
    "build": "vite build && tsc",
    "watch": "concurrently \"vite build --watch\" \"tsc -w\"",
    "test": "vitest",
    "lint": "eslint . --ext .ts --max-warnings 0",
    "lintfix": "npm run lint -- --fix",
    "clean": "rimraf dist lib",
    "examples:dev": "cd examples && npm run dev",
    "examples:build": "cd examples && npm run build"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/feng3d-labs/webgpu.git",
    "directory": "gpu-driven-rendering"
  },
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "src",
    "dist",
    "docs"
  ],
  "dependencies": {
    "@feng3d/webgpu": "*"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "8.32.1",
    "@typescript-eslint/parser": "8.32.1",
    "eslint": "9.26.0",
    "rimraf": "6.0.1",
    "typescript": "5.8.3",
    "typescript-eslint": "8.32.1",
    "vite": "6.3.5",
    "vitest": "3.1.3",
    "concurrently": "9.1.2"
  },
  "workspaces": [
    "./examples"
  ]
}
```

- [ ] **Step 2: 验证 JSON 格式**

```bash
cd gpu-driven-rendering && cat package.json | jq .
```

Expected: 有效 JSON 输出

- [ ] **Step 3: 提交**

```bash
git add gpu-driven-rendering/package.json
git commit -m "feat: add package.json for @feng3d/gpu-driven-rendering"
```

---

## Task 2: 创建 TypeScript 配置

**Files:**
- Create: `gpu-driven-rendering/tsconfig.json`

- [ ] **Step 1: 创建 tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../src" }
  ]
}
```

- [ ] **Step 2: 验证配置**

```bash
cd gpu-driven-rendering && tsc --showConfig
```

Expected: 配置输出显示正确的继承关系

- [ ] **Step 3: 提交**

```bash
git add gpu-driven-rendering/tsconfig.json
git commit -m "feat: add tsconfig.json for gpu-driven-rendering"
```

---

## Task 3: 创建 Vite 配置

**Files:**
- Create: `gpu-driven-rendering/vite.config.ts`

- [ ] **Step 1: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'GPUDrivenRendering',
      fileName: (format) => `index.${format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['@feng3d/webgpu', '@feng3d/reactivity', '@webgpu/types'],
      output: {
        globals: {
          '@feng3d/webgpu': 'WebGPU'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
```

- [ ] **Step 2: 提交**

```bash
git add gpu-driven-rendering/vite.config.ts
git commit -m "feat: add vite.config.ts for library build"
```

---

## Task 4: 创建 ESLint 配置

**Files:**
- Create: `gpu-driven-rendering/.eslintrc.json`

- [ ] **Step 1: 创建 .eslintrc.json**

```json
{
  "extends": "../.eslintrc.json"
}
```

- [ ] **Step 2: 提交**

```bash
git add gpu-driven-rendering/.eslintrc.json
git commit -m "feat: add eslint config extending root config"
```

---

## Task 5: 创建源码目录结构

**Files:**
- Create: `gpu-driven-rendering/src/index.ts`
- Create: `gpu-driven-rendering/src/core/index.ts`
- Create: `gpu-driven-rendering/src/culling/index.ts`
- Create: `gpu-driven-rendering/src/lod/index.ts`
- Create: `gpu-driven-rendering/src/transparent/index.ts`

- [ ] **Step 1: 创建主入口**

```typescript
// gpu-driven-rendering/src/index.ts

/**
 * @feng3d/gpu-driven-rendering
 * WebGPU 全GPU驱动渲染系统
 */

// 主入口（待实现）
export class GPUDrivenRenderer {
  // TODO: 实现阶段1
}

// 类型导出
export type { ObjectData, Camera, Material } from './types';

// 子路径导出（占位）
export * from './core';
export * from './culling';
export * from './lod';
export * from './transparent';

// 类型定义（占位）
export interface ObjectData {
  worldMat: Float32Array;
  materialIndex: number;
  indexOffset: number;
  indexCount: number;
}

export interface Camera {
  viewProjMat: Float32Array;
  pos: Float32Array;
}

export interface Material {
  albedo: Float32Array;
  roughness: number;
  metalness: number;
}
```

- [ ] **Step 2: 创建 core 模块入口**

```typescript
// gpu-driven-rendering/src/core/index.ts

// 核心渲染模块（待实现）
export {}; // 占位
```

- [ ] **Step 3: 创建 culling 模块入口**

```typescript
// gpu-driven-rendering/src/culling/index.ts

// 剔除系统模块（待实现）
export {}; // 占位
```

- [ ] **Step 4: 创建 lod 模块入口**

```typescript
// gpu-driven-rendering/src/lod/index.ts

// LOD 系统模块（待实现）
export {}; // 占位
```

- [ ] **Step 5: 创建 transparent 模块入口**

```typescript
// gpu-driven-rendering/src/transparent/index.ts

// 透明渲染模块（待实现）
export {}; // 占位
```

- [ ] **Step 6: 提交**

```bash
git add gpu-driven-rendering/src/
git commit -m "feat: add source directory structure with placeholder exports"
```

---

## Task 6: 创建示例项目

**Files:**
- Create: `gpu-driven-rendering/examples/package.json`
- Create: `gpu-driven-rendering/examples/vite.config.ts`
- Create: `gpu-driven-rendering/examples/tsconfig.json`
- Create: `gpu-driven-rendering/examples/src/main.ts`
- Create: `gpu-driven-rendering/examples/public/index.html`

- [ ] **Step 1: 创建 examples/package.json**

```json
{
  "name": "gpu-driven-rendering-examples",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@feng3d/webgpu": "*",
    "@feng3d/gpu-driven-rendering": "*"
  },
  "devDependencies": {
    "vite": "^6.3.5",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 2: 创建 examples/vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    strictPort: false
  }
});
```

- [ ] **Step 3: 创建 examples/tsconfig.json**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../src" }
  ]
}
```

- [ ] **Step 4: 创建 examples/src/main.ts**

```typescript
// examples/src/main.ts

import { GPUDrivenRenderer } from '@feng3d/gpu-driven-rendering';

console.log('GPU-Driven Rendering Examples');
console.log('GPUDrivenRenderer:', GPUDrivenRenderer);

// TODO: 添加示例代码
```

- [ ] **Step 5: 创建 examples/public/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GPU-Driven Rendering Examples</title>
  <style>
    body { margin: 0; font-family: system-ui; }
    canvas { display: block; }
  </style>
</head>
<body>
  <h1>GPU-Driven Rendering Examples</h1>
  <p>示例待实现</p>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: 提交**

```bash
git add gpu-driven-rendering/examples/
git commit -m "feat: add examples subproject with basic setup"
```

---

## Task 7: 创建测试占位

**Files:**
- Create: `gpu-driven-rendering/test/placeholder.test.ts`

- [ ] **Step 1: 创建占位测试**

```typescript
// gpu-driven-rendering/test/placeholder.test.ts

import { describe, it } from 'vitest';

describe('@feng3d/gpu-driven-rendering', () => {
  it('should have placeholder test', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: 提交**

```bash
git add gpu-driven-rendering/test/
git commit -m "test: add placeholder test"
```

---

## Task 8: 更新根项目 workspace 配置

**Files:**
- Modify: `package.json` (根项目)

- [ ] **Step 1: 读取根 package.json**

```bash
cat package.json
```

- [ ] **Step 2: 更新 workspaces 字段**

在根 `package.json` 中找到 `workspaces` 字段，添加 `./gpu-driven-rendering` 和 `./gpu-driven-rendering/examples`：

```json
{
  "workspaces": [
    ".",
    "./examples",
    "./test_web",
    "./gpu-driven-rendering",
    "./gpu-driven-rendering/examples",
    "packages/*",
    "packages/*/examples"
  ]
}
```

- [ ] **Step 3: 提交**

```bash
git add package.json
git commit -m "feat: add gpu-driven-rendering to npm workspaces"
```

---

## Task 9: 安装依赖并验证

- [ ] **Step 1: 安装依赖**

```bash
npm install
```

Expected: 无错误，依赖正确链接

- [ ] **Step 2: 验证 workspace 链接**

```bash
ls node_modules/@feng3d/gpu-driven-rendering
```

Expected: 符号链接指向 `../../gpu-driven-rendering`

- [ ] **Step 3: 验证示例项目依赖**

```bash
cd gpu-driven-rendering/examples && npm install
```

Expected: 无错误，`@feng3d/webgpu` 和 `@feng3d/gpu-driven-rendering` 正确链接

- [ ] **Step 4: 运行类型检查**

```bash
cd gpu-driven-rendering && npx tsc --noEmit
```

Expected: 无类型错误（可能有占位符警告，可忽略）

- [ ] **Step 5: 运行测试**

```bash
cd gpu-driven-rendering && npm test
```

Expected: 测试通过

- [ ] **Step 6: 提交**

```bash
git add package-lock.json gpu-driven-rendering/examples/package-lock.json
git commit -m "chore: install dependencies and verify workspace setup"
```

---

## Task 10: 验证示例开发服务器

- [ ] **Step 1: 启动示例开发服务器**

```bash
cd gpu-driven-rendering && npm run dev
```

Expected: 服务器启动，显示类似 `Local: http://localhost:5174/`

- [ ] **Step 2: 浏览器测试**

打开浏览器访问 `http://localhost:5174/`

Expected: 显示 "GPU-Driven Rendering Examples" 页面，控制台无错误

- [ ] **Step 3: 停止服务器**

按 `Ctrl+C` 停止

- [ ] **Step 4: 更新 PROGRESS.md**

将 `gpu-driven-rendering/PROGRESS.md` 中阶段0的任务状态更新为 ✅：

```markdown
| 创建 package.json | ✅ 已实现 | gpu-driven-rendering/package.json |
| 创建 tsconfig.json | ✅ 已实现 | gpu-driven-rendering/tsconfig.json |
...
```

- [ ] **Step 5: 提交**

```bash
git add gpu-driven-rendering/PROGRESS.md
git commit -m "docs: mark stage 0 tasks as completed"
```

---

## 验收标准

完成所有任务后：

- [x] `npm install` 在根目录成功安装依赖
- [x] `cd gpu-driven-rendering && npm run dev` 成功启动示例服务器
- [x] 浏览器访问示例页面无错误
- [x] `cd gpu-driven-rendering && npm run build` 成功构建
- [x] `cd gpu-driven-rendering && npm test` 测试通过
- [x] workspace 协议正确链接本地 `@feng3d/webgpu`

---

## 下一步

完成阶段0后，可以继续：
- **阶段1：全GPU渲染核心** - 实现核心渲染模块
- **@feng3d/webgpu 扩展** - 先在主包实现间接绘制等扩展功能

详见：[gpu-driven-rendering/PROGRESS.md](../../gpu-driven-rendering/PROGRESS.md)
