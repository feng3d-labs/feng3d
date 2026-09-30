import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import feng3dPlugin from 'eslint-plugin-feng3d';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'lib/**',
      'public/**',
      '*.config.js',
      'packages/webgpu/examples/**',
          // packages/editor：编辑器有自己的 eslint.config.js（包内 `npm run lint` 已 0 问题），
      // 但这里仍整体忽略它——因为它的规则集与主仓不同（Vue SFC、不同的 globals），
      // 直接纳入根配置会引入大量与本仓规范无关的报错。
      // 响应式纪律（r_ 前缀等）由编辑器自己的配置覆盖，见 packages/editor/eslint.config.js。
      'packages/editor/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLIFrameElement: 'readonly',
        HTMLTemplateElement: 'readonly',
        OffscreenCanvas: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        createImageBitmap: 'readonly',
        devicePixelRatio: 'readonly',
        getComputedStyle: 'readonly',
        ResizeObserver: 'readonly',
        ResizeObserverEntry: 'readonly',
        MouseEvent: 'readonly',
        // WebGPU globals
        GPUBuffer: 'readonly',
        GPUBindGroup: 'readonly',
        GPUCompareFunction: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'feng3d': feng3dPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'semi': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'no-prototype-builtins': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-constant-binary-expression': 'off',
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      'no-unassigned-vars': 'off',
      // Feng3D 响应式对象规则（源码文件）
      'feng3d/reactive-naming': 'error',
      'feng3d/no-reactive-export': 'error',
      'feng3d/no-reactive-argument': 'error',
      'feng3d/effect-annotation': 'error',
      'feng3d/no-module-side-effect': 'error',
    },
  },
  // 测试文件规则（降级为警告）
  {
    files: ['**/*.spec.ts', '**/test/**/*.ts'],
    ...js.configs.recommended,
    plugins: {
      '@typescript-eslint': tsPlugin,
      'feng3d': feng3dPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLIFrameElement: 'readonly',
        HTMLTemplateElement: 'readonly',
        OffscreenCanvas: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        createImageBitmap: 'readonly',
        devicePixelRatio: 'readonly',
        getComputedStyle: 'readonly',
        ResizeObserver: 'readonly',
        ResizeObserverEntry: 'readonly',
        MouseEvent: 'readonly',
        GPUBuffer: 'readonly',
        GPUBindGroup: 'readonly',
        GPUCompareFunction: 'readonly',
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'semi': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-prototype-builtins': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-constant-binary-expression': 'off',
      'preserve-caught-error': 'off',
      // Feng3D 响应式对象规则（测试文件仅警告）
      'feng3d/reactive-naming': 'off',
      'feng3d/no-reactive-export': 'off',
      'feng3d/no-reactive-argument': 'off',
      'feng3d/effect-annotation': 'off',
      'feng3d/no-module-side-effect': 'off',
    },
  },
  // examples 是**应用入口**（页面脚本）：import 即启动定时器 / rAF 循环是它的固有语义，
  // 与"库模块不得有 import 副作用"（R2）不冲突——所以这里只关掉该条自研规则，
  // 响应式命名等纪律仍生效（issue #77）。
  {
    files: ['examples/**/*.ts'],
    ...js.configs.recommended,
    plugins: {
      '@typescript-eslint': tsPlugin,
      'feng3d': feng3dPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'feng3d/no-module-side-effect': 'off',
    },
  },
  // scripts/ 与 test/ 下的代码运行在 Node 里（issue #350）。
  //
  // 上面几个带 files 的块分别只匹配 `**/*.ts`、`**/*.spec.ts`、`examples/**/*.ts`，都覆盖不到 `.mjs`；
  // 而 `js.configs.recommended` 虽然没有 files 限制（对所有文件生效），却不含 node globals
  // ——于是任何用了 `process` / `readFileSync` 的 `.mjs` 都会报一片 `no-undef`（实测 502 个）。
  // 另注意 `test/**/*.ts` 虽然命中了上面的 spec 块，那个块里也只有测试与浏览器的 globals，
  // 而测试经常要用 `node:fs` / `process.argv`，所以这里同样需要 node globals（flat config 的 globals 是合并的）。
  {
    files: ['scripts/**/*.mjs', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        // Node 全局。只列实际用到的——新增用到别的时按 lint 报错补上来，
        // 这样这份清单本身也被 lint 守着，不会悄悄缺项。
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
      AbortSignal: 'readonly',
        performance: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      // 解构排除（`const { 丢掉, ...rest } = obj`）是**故意**丢弃字段的写法，
      // 那些"兄弟"变量本来就不会被用到。ESLint 为此提供了 ignoreRestSiblings，
      // 用它比在每个调用点写 eslint-disable 正确得多（也能继续抓到真正的未使用变量）。
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
];
