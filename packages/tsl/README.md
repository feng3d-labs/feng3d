# @feng3d/tsl

> feng3d 引擎的着色器语言库，使用 TypeScript 编写着色器代码，生成 WebGL/WebGPU 着色器

[![npm version](https://badge.fury.io/js/%40feng3d%2ftsl.svg)](https://www.npmjs.com/package/@feng3d/tsl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 简介

`@feng3d/tsl` 是一个强大的着色器语言库，让你能够使用 TypeScript 的类型系统和语法来编写 GPU 着色器代码。它能够将 TypeScript 代码转换为 GLSL（WebGL）和 WGSL（WebGPU）着色器代码，同时提供完整的类型安全。

## 特性

- **类型安全**：利用 TypeScript 的类型系统，在编写着色器时获得完整的类型检查和智能提示
- **双平台支持**：同时生成 GLSL 和 WGSL 代码，支持 WebGL 和 WebGPU
- **丰富的 API**：涵盖 GLSL 的核心功能，包括变量、控制流、向量/矩阵运算、纹理采样等
- **链式语法**：提供流畅的链式 API，让着色器代码更易读易写
- **零运行时开销**：着色器代码在构建时生成，无需运行时编译

## 安装

```bash
npm install @feng3d/tsl
```

## 快速开始

### 基础示例

```typescript
import { attribute, fragment, precision, return_, uniform, vec2, vec4, vertex } from '@feng3d/tsl';

// 定义顶点属性
const position = attribute('position', vec2());

// 定义 Uniform 变量
const color = uniform('color', vec4());

// 顶点着色器
export const vertexShader = vertex('main', () => {
    return_(vec4(position, 0.0, 1.0));
});

// 片元着色器
export const fragmentShader = fragment('main', () => {
    precision('mediump', 'float');
    return_(color);
});
```

### 生成着色器代码

```typescript
// 生成 GLSL 代码
const vertexGlsl = vertexShader.toGLSL();
const fragmentGlsl = fragmentShader.toGLSL();

// 生成 WGSL 代码
const vertexWgsl = vertexShader.toWGSL();
const fragmentWgsl = fragmentShader.toWGSL();
```

## API 概览

### 变量

| API | 说明 |
|-----|------|
| `attribute(name, type)` | 顶点属性变量 |
| `uniform(name, type)` | Uniform 变量 |
| `varying(name, type)` | Varying 变量 |
| `let_(name, value)` | Let 变量 |
| `var_(name, value)` | Var 变量 |
| `struct(name, members)` | 结构体 |
| `array(type, size)` | 数组 |

### 着色器

| API | 说明 |
|-----|------|
| `vertex(name, fn)` | 顶点着色器入口 |
| `fragment(name, fn)` | 片元着色器入口 |
| `func(name, fn)` | 自定义函数 |

### 类型

**标量类型**：`bool`, `float`, `int`, `uint`

**向量类型**：`vec2`, `vec3`, `vec4`, `ivec2`, `ivec3`, `ivec4`, `uvec2`, `uvec3`, `uvec4`, `bvec3`

**矩阵类型**：`mat2`, `mat4`, `mat4x3`

### 数学函数

**三角函数**：`sin`, `cos`, `atan`, `acos`

**指数函数**：`exp`, `log2`, `pow`, `sqrt`

**通用函数**：`abs`, `min`, `max`, `clamp`, `mix`, `smoothstep`, `step`, `fract`

### 向量运算

| API | 说明 |
|-----|------|
| `dot(a, b)` | 点积 |
| `cross(a, b)` | 叉积 |
| `normalize(v)` | 归一化 |
| `reflect(I, N)` | 反射 |
| `lessThan(a, b)` | 小于比较 |

### 纹理

| API | 说明 |
|-----|------|
| `texture(sampler, uv)` | 纹理采样 |
| `texture2D(sampler, uv)` | 2D 纹理采样 |
| `textureLod(sampler, uv, lod)` | LOD 纹理采样 |
| `textureGrad(sampler, uv, ddx, ddy)` | 梯度纹理采样 |
| `texelFetch(sampler, uv, lod)` | 纹素获取 |
| `textureSize(sampler, lod)` | 纹理尺寸 |

### 控制流

| API | 说明 |
|-----|------|
| `if_(condition, then, else?)` | 条件分支 |
| `select(condition, a, b)` | 选择 |
| `return_(value)` | 返回 |

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint

# 生成文档
npm run docs
```

## 示例

查看 [examples](./examples) 目录了解更多示例：

- [WebGL2 Samples](./examples/src/WebGL2Samples) - WebGL2 功能示例
- [Regl Examples](./examples/src/regl-examples) - 移植自 regl 的示例

## 相关项目

- [@feng3d/render-api](https://github.com/feng3d-labs/render-api) - 统一的渲染 API
- [@feng3d/webgl](https://github.com/feng3d-labs/webgl) - WebGL 渲染后端
- [@feng3d/webgpu](https://github.com/feng3d-labs/webgpu) - WebGPU 渲染后端

## 许可证

[MIT](LICENSE)

## 链接

- [文档](https://feng3d.com/tsl/)
- [GitHub](https://github.com/feng3d-labs/tsl)
