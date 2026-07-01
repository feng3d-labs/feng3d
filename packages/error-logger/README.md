# @feng3d/error-logger

前端日志收集 vite 插件。注册后自动完成两件事，无需任何额外代码：

1. **前端自动拦截**：向所有页面注入脚本，拦截 `console` 与全局错误并上报
2. **服务端自动接收**：注册中间件接收上报，按客户端会话写入本地日志文件

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

启动 dev server 后，所有页面的 `console.log/warn/error/info` 与全局错误会自动收集到项目根目录的 `logs/`。

> **monorepo 注意**：vite 加载 config 时处于 Node 环境，无法用包名 import 源码发布的 `.ts` 入口。monorepo 内部使用时需保证包的 `./vite` 入口指向 `.mjs`（本包已如此配置），并在使用方 `package.json` 中声明 `"type": "module"`。

## 配置

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `endpoint` | `string` | `'/api/log'` | 日志接收端点路径 |
| `logDir` | `string` | `'<root>/logs'` | 日志输出目录（绝对路径或相对项目根） |

```ts
errorLoggerPlugin({ logDir: './my-logs', endpoint: '/collect' });
```

## 日志文件

按客户端会话分组，文件名用毫秒区分（无随机串）：

```
logs/frontend_20260701_203153482.log
```

每个文件首部写入浏览器环境信息，随后是带时间戳的日志行：

```
===================================================================
客户端 ID: client_1782908393968
时间: 2026-07-01T12:31:53.482Z
-------------------------------------------------------------------
=== 浏览器环境信息 === { ... }
===================================================================

[20:31:54.015] 页面加载完成
[20:31:55.288] ❌ [全局错误] TypeError: Cannot read properties of undefined
```

## 工作原理

```
浏览器                                  vite dev server
┌──────────────────────┐               ┌─────────────────────┐
│  console.log(...)    │   POST        │  /api/log 中间件     │
│  window.onerror      │ ───────────▶  │  按会话分组          │
│  (插件自动注入拦截)   │  /api/log     │  写入本地 .log 文件  │
└──────────────────────┘               └─────────────────────┘
        ▲                                      │
        │ transformIndexHtml 注入虚拟模块脚本   ▼
        └──────────────────────────────  logs/frontend_*.log
```

1. `transformIndexHtml` 向所有 HTML 注入一个外部 module script，src 指向虚拟模块
2. 虚拟模块（由 `resolveId`/`load` 提供）拦截 console 与全局错误，通过 `sendBeacon` 上报
3. 服务端中间件接收并按会话写入日志文件

## License

MIT
