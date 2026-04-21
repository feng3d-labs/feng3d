# Feng3D Web3D Engine

Feng3D 是一个基于 WebGPU 的 Web 3D 引擎 monorepo。

## 结构

```
feng3d/
├── packages/
│   ├── webgpu/         - WebGPU 渲染后端
│   └── gpu-driven-rendering/ - GPU 驱动渲染文档
```

## 快速开始

```bash
# 安装依赖
npm install

# 构建所有包
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

## 开发

每个包专注于特定功能，由根目录统一管理：
- 构建流程
- 测试
- 文档生成
- 发布

## 许可证

MIT
