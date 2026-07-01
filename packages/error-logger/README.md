# @feng3d/error-logger

前端日志收集 + 截图 vite 插件。注册后自动完成两件事，无需任何额外代码：

1. **前端自动拦截**：向所有页面注入脚本，拦截 `console` 与全局错误并上报；出错时自动截图
2. **服务端自动接收**：注册中间件接收上报的日志与截图，分别写入本地文件

适用于无法直接查看浏览器控制台的场景（远程调试、自动化测试、AI 辅助开发等）。

---

## 安装

```bash
npm install @feng3d/error-logger
```

## 用法

在 `vite.config.ts` 注册插件即可：

```ts
import { defineConfig } from 'vite';
import { errorLoggerPlugin } from '@feng3d/error-logger/vite';

export default defineConfig({
    plugins: [errorLoggerPlugin()],
});
```

启动 dev server 后：
- 所有页面的 `console.log/warn/error/info` 与全局错误自动收集到 `logs/frontend_*.log`
- 全局错误触发时自动截图，存为 `logs/screenshot_*.png`
- 浏览器控制台执行 `window.__captureScreen('调试某帧')` 可手动截图

> **monorepo 注意**：vite 加载 config 时处于 Node 环境，无法用包名 import 源码发布的 `.ts` 入口。monorepo 内部使用时需保证包的 `./vite` 入口指向 `.mjs`（本包已如此配置），并在使用方 `package.json` 中声明 `"type": "module"`。

## 配置

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `endpoint` | `string` | `'/api/log'` | 日志接收端点 |
| `screenshotEndpoint` | `string` | `'/api/screenshot'` | 截图接收端点 |
| `logDir` | `string` | `'<root>/logs'` | 日志与截图的输出目录 |

```ts
errorLoggerPlugin({ logDir: './my-logs' });
```

## 截图功能

截图通过 `canvas.toDataURL('image/png')` 读取渲染 canvas 当前呈现内容，base64 上报后存为 PNG。

**两种触发方式：**

| 方式 | 说明 |
|---|---|
| **手动** | 浏览器控制台执行 `window.__captureScreen('原因说明')`，适合在渲染问题点主动截图 |
| **自动** | 捕获到全局 `error` / `unhandledrejection` 时自动截图，无需手动调用 |

截图会自动在对应会话的日志文件里追加一条引用，便于把文本日志和图像关联起来：

```
[20:38:51.770] ❌ [全局错误] TypeError: Cannot read properties of undefined
[20:38:51.772] 📷 [截图] screenshot_20260701_203851770.png (error, 1038x1305)
```

**canvas 查找策略**：优先取 `id="glcanvas"`（feng3d 默认 canvas id），否则取页面上最后一个 canvas 元素。

## 日志文件

按客户端会话分组，文件名用毫秒区分（无随机串）：

```
logs/frontend_20260701_203153482.log   # 会话日志
logs/screenshot_20260701_203851770.png  # 截图
```

每个日志文件首部写入浏览器环境信息，随后是带时间戳的日志行。

## 工作原理

```
浏览器                                  vite dev server
┌──────────────────────┐               ┌─────────────────────┐
│  console.log(...)    │   POST        │  /api/log 中间件     │
│  window.onerror      │ ───────────▶  │  按会话分组写 .log   │
│  (自动拦截+上报)      │  /api/log     │                     │
│                      │               │                     │
│  canvas.toDataURL()  │   POST        │  /api/screenshot     │
│  (手动/出错自动截图)  │ ───────────▶  │  base64 解码存 .png  │
└──────────────────────┘  /api/screenshot │  并在日志写引用     │
        ▲                                      │
        │ transformIndexHtml 注入虚拟模块脚本   ▼
        └──────────────────────────────  logs/
```

## License

MIT
