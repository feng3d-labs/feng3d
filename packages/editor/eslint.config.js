// packages/editor 自己的 ESLint flat config。
//
// 为什么需要单独一份：根 `eslint.config.js` 把 `packages/editor/**` 整体忽略
// （注释说明编辑器仍在做 API 适配），而 flat config 的 `ignores` 是**全局**的，
// 命令行 `--no-ignore` 也绕不过去（实测 `eslint --print-config` 对该目录返回 undefined）。
//
// 这份配置只启用**与风格和常见错误有关**的规则，不做类型感知检查（那由 `npm run type-check`
// 负责），因此不会与既有的 API 适配工作冲突。
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'lib/**',
            'public/**',
            'resource/**',
            'libs/**',
            'auto-imports.d.ts',
            'components.d.ts',
            'src/vite-env.d.ts',
            'src/file-saver.d.ts',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                performance: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                HTMLElement: 'readonly',
                HTMLCanvasElement: 'readonly',
                HTMLImageElement: 'readonly',
                ImageData: 'readonly',
                CanvasImageSource: 'readonly',
                ErrorEvent: 'readonly',
                PromiseRejectionEvent: 'readonly',
                Element: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                MutationObserver: 'readonly',
                ResizeObserver: 'readonly',
                IntersectionObserver: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
                Blob: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                FormData: 'readonly',
                indexedDB: 'readonly',
                process: 'readonly',
                globalThis: 'readonly',
            },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        // 刻意关掉「多余 disable 注释」的举报：本配置关掉了若干规则，
        // 而源码里的 `eslint-disable-next-line` 在将来重新启用那些规则时仍然有用
        linterOptions: { reportUnusedDisableDirectives: 'off' },
        rules: {
            // TS 文件里的「未定义」交给 tsc 判断，eslint 的 no-undef 对类型与装饰器误报太多
            'no-undef': 'off',
            // 未使用变量/私有成员同样交给 tsc（noUnusedLocals 等），这里不重复报
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-private-class-members': 'off',
            // 与本仓风格一致（根 AGENTS.md 第 6 章）
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
            'no-var': 'error',
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'no-throw-literal': 'error',
            'no-debugger': 'error',
            // 引擎里大量存在「先声明后赋值的可选字段」写法，这条规则噪音过大
            'no-useless-escape': 'off',
        },
    },
];
