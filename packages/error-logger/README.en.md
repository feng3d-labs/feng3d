# @feng3d/error-logger

A **front-end logging Vite plugin**: it intercepts the browser `console` and global errors,
reports them to the dev server, and the server-side middleware writes them to a local log file
per session. No logging code is needed in application code.

The plugin does two things at once:

1. **Server side**: registers a middleware that receives front-end logs and writes
   `<project root>/logs/frontend_<timestamp>.log`;
2. **Client side**: injects an interception script into every HTML page for
   `console.log / warn / error / info`, `window.onerror` and `unhandledrejection`.

## Install

```bash
npm install @feng3d/error-logger
```

## Usage

```ts
import { defineConfig } from 'vite';
import { errorLoggerPlugin } from '@feng3d/error-logger';

export default defineConfig({
    plugins: [errorLoggerPlugin()],
});
```

After the dev server starts, console output and global errors are written under `logs/`.

## Options

```ts
errorLoggerPlugin({
    endpoint: '/api/log',   // log endpoint, defaults to '/api/log'
    logDir: 'logs',         // output directory; relative to the project root, absolute used as-is; defaults to <project root>/logs
});
```

## Behavior

- Non-`POST` requests → `405 Method Not Allowed`, nothing is written;
- `POST` with valid JSON → writes `frontend_<YYYYMMDD_HHmmssSSS>.log` named after `clientId`;
  the browser environment header (User-Agent / language / viewport / timezone) is written once per
  session, then entries are appended;
- `POST` with invalid JSON → the middleware swallows the error and the dev server keeps running.

## License

MIT
