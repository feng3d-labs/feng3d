# 项目概述

`@feng3d/webgpu` 是 feng3d 引擎的 WebGPU 渲染后端库，提供 WebGPU API 的 TypeScript 封装和响应式对象系统。

## 特性

- **TypeScript 封装**：完整的 WebGPU API TypeScript 类型支持
- **响应式系统**：基于 `@feng3d/reactivity` 的响应式对象
- **缓存管理**：自动管理 WebGPU 资源（Buffer、Texture、Pipeline 等）
- **渲染抽象**：统一的渲染对象和计算对象 API
- **着色器支持**：集成 `@feng3d/tsl` 着色器语言库

## 子模块

- `packages/tsl` - 着色器语言库（TypeScript to WGSL）
- `packages/render-api` - 渲染 API 抽象层

## 快速链接

- [快速开始](quickstart.md)
- [架构说明](architecture.md)
- [API 参考](api.md)
