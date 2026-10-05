# feng3d-editor

feng3d 引擎的可视化编辑器（Vue 3 + TypeScript + Vite）。

代码已收回主仓 `packages/editor`，是 workspace 成员，与其余包同等地进 lint / 类型检查 / 测试 / 构建门禁。

## 文档

| 文档 | 内容 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 编辑器架构总纲（形态、分层、分期、未决策项） |
| [docs/PLUGINS.md](docs/PLUGINS.md) | 插件机制：清单 / 插槽 / 贡献点 / 启用禁用 |
| [docs/NODE_HOST.md](docs/NODE_HOST.md) | Node 宿主 + Web UI 的宿主架构 |
| [docs/PLUGIN_TRIPLE_HALF.md](docs/PLUGIN_TRIPLE_HALF.md) | 插件三端形态（宿主 / Web / 游戏运行时） |
| [docs/OBJECT_VIEW_CONFIG.md](docs/OBJECT_VIEW_CONFIG.md) | 属性面板的字段与分组配置 |
| [../../docs/EDITOR_AI_BRIDGE.md](../../docs/EDITOR_AI_BRIDGE.md) | AI 桥接协议与方法表 |
| [AGENTS.md](AGENTS.md) | 本包专属开发规范 |

## 常用命令

```bash
npm run dev        # 开发（必须用 npm，pnpm 会导致发布失败）
npm run build      # 构建
npm run type-check # 类型检查
npm run lint       # 代码检查（max-warnings 0）
npm run test       # 单元测试
```

## 命令行入口

`bin/serve.mjs` 提供 `feng3d-editor` 命令，用于启动本地编辑器宿主。

## Issues

https://github.com/feng3d-labs/feng3d/issues

## 在线版本

http://feng3d.com/editor/index.html

## 交流

QQ 群：519732759

## 许可

MIT
