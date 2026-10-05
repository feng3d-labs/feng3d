# @feng3d/error-logger

**前端日志收集 Vite 插件**：自动拦截浏览器 `console` 与全局错误，上报到 dev server，
由服务端中间件按会话写入本地日志文件。接入后无需在业务代码里写任何上报逻辑。

一个插件同时完成两件事：

1. **服务端**：注册中间件接收前端上报的日志，写入 `<项目根>/logs/frontend_<时间戳>.log`；
2. **前端**：向所有 HTML 自动注入拦截脚本——`console.log / warn / error / info`、
   `window.onerror`、`unhandledrejection`。

## 安装

```bash
npm install @feng3d/error-logger
```

## 使用

```ts
import { defineConfig } from 'vite';
import { errorLoggerPlugin } from '@feng3d/error-logger';

export default defineConfig({
    plugins: [errorLoggerPlugin()],
});
```

启动 dev server 后正常使用页面即可：控制台输出与全局错误会落盘到 `logs/` 目录。

## 配置

```ts
errorLoggerPlugin({
    endpoint: '/api/log',   // 日志接收端点，默认 '/api/log'
    logDir: 'logs',         // 输出目录；相对路径相对项目根，绝对路径原样使用；默认 <项目根>/logs
});
```

## 行为

- 非 `POST` 请求 → `405 Method Not Allowed`，不写文件；
- `POST` 合法 JSON → 按 `clientId` 生成文件名 `frontend_<YYYYMMDD_HHmmssSSS>.log`；
  会话开始写入一次浏览器环境信息（User-Agent / 语言 / 视口 / 时区等），其后逐条追加；
- `POST` 非法 JSON → 中间件吞掉异常，不中断 dev server。

## 许可

MIT
