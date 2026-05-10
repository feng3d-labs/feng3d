# 项目概述

## 什么是 TSL

**TSL** (TypeScript Shader Language) 是 feng3d 引擎的着色器语言库。它让开发者能够使用 TypeScript 的类型系统和语法来编写 GPU 着色器代码，并生成 WebGPU 的 WGSL 着色器代码。

## 为什么使用 TSL

### 传统着色器开发的问题

```glsl
// 传统 GLSL - 无类型检查，IDE 支持有限
attribute vec3 position;
uniform mat4 modelViewProjection;
varying vec3 vPosition;

void main() {
    vPosition = position;
    gl_Position = modelViewProjection * vec4(position, 1.0);
}
```

**问题**：
- 无类型检查，错误只能在运行时发现
- 无智能提示，需要记忆大量 API
- 调试困难，无法设置断点
- 代码复用困难，函数传递复杂

### TSL 的解决方案

```typescript
// TSL - 完整的 TypeScript 类型支持
import { attribute, uniform, vec3, vec4, mat4, vertex } from '@feng3d/tsl';

const position = attribute('position', vec3());
const mvp = uniform('modelViewProjection', mat4());

export const vertexShader = vertex('main', () => {
    return mvp * vec4(position, 1.0);
});
```

**优势**：
- ✅ 完整的类型检查和智能提示
- ✅ 编译时发现错误
- ✅ 支持 TypeScript 工具链
- ✅ 代码复用简单自然

## 功能特性

### 类型安全

```typescript
const v = vec3(1, 2, 3);      // 类型：Vec3
const result: Vec3 = v.add(v); // 类型检查通过
const error: string = v;       // 类型错误！
```

### 链式语法

```typescript
const color = position
    .normalize()
    .mul(2.0)
    .add(vec3(0.5));
```

### 自动依赖分析

TSL 自动分析着色器代码中的所有依赖：
- 自动收集 attributes
- 自动收集 uniforms
- 自动分配 location/binding
- 自动生成变量声明

### 平台抽象

同一套代码可生成多种着色器语言：
- WGSL (WebGPU)
- GLSL (WebGL/WebGL2)

## 适用场景

- **WebGPU 应用开发** - 3D 可视化、游戏、数据展示
- **着色器库开发** - 可复用的着色器组件
- **工具开发** - 着色器编辑器、转换工具
- **教育用途** - 教授着色器编程概念

## 项目结构

```
tsl/
├── src/
│   ├── core/           # 核心模块
│   ├── variables/      # 变量声明
│   ├── types/          # 类型系统
│   ├── shader/         # 着色器入口
│   ├── math/           # 数学函数
│   ├── glsl/           # GLSL 专有
│   ├── control/        # 控制流
│   └── vector/         # 向量运算
└── examples/           # 示例代码
```

## 相关项目

- [@feng3d/render-api](https://github.com/feng3d-labs/render-api) - 统一的渲染 API
- [@feng3d/webgpu](https://github.com/feng3d-labs/webgpu) - WebGPU 渲染后端

---

*最后更新: 2026-02-26*
