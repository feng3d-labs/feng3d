# @feng3d/editor-plugin-rotate

**编辑器插件三端形态的样板**（[feng3d#276](https://github.com/feng3d-labs/feng3d/issues/276) 阶段 3）。

它存在的理由不是"提供一个旋转功能"，而是**把三端形态做出来给后来的插件抄**：
同一份包在三个地方各有一个入口，共享同一份 `__type__` 契约——
"编辑格式 = 运行格式"在这里是可执行、可测试、可门禁检查的。

## 三端

| 端 | 入口 | 这一端做什么 | 允许依赖什么 |
|---|---|---|---|
| 编辑器宿主（Node） | `"."` | cordis 插件：挂宿主侧服务 / 命令（本样板只演示形状） | `@deepseek-ai/cordis`、引擎 API |
| 编辑器界面（Web） | `"./client"` | 声明界面贡献点（这里往 `panel.main` 座位加一个标签页） | `feng3d-editor/client`、Vue |
| 游戏项目端 | `"./runtime"` | 把本插件引入的 `__type__` 注册到引擎 Logic 分发表 | **只允许引擎 API**（`@feng3d/reactivity` / `feng3d`） |

三端共用 [`src/shared.ts`](src/shared.ts) 里的 `ROTATE_TYPE` / `Rotate` —— 类型与
`__type__` 字符串只有一份，谁都不能各写一份。

## 声明（`package.json`）

```jsonc
{
    "exports": {
        ".":          { "types": "./src/index.ts",   "import": "./src/index.ts" },
        "./client":   { "types": "./src/client.ts",  "import": "./src/client.ts" },
        "./runtime":  { "types": "./src/runtime.ts", "import": "./src/runtime.ts" }
    },
    "feng3dEditor": {
        "apiVersion": "^1.0.0",
        "halves": { "host": ".", "client": "./client", "runtime": "./runtime" }
    }
}
```

`halves` 是**可选自述**：写了就要求与 `exports` 一致（不一致会被
`checkPluginPackage` 拦下，避免"文档说三端、实际只有两端"）。
`apiVersion` 与清单用的是**同一条**核对规则（`checkApiVersion`）。

## 边界由门禁守着（不是靠文档约定）

| 门禁 | 管什么 |
|---|---|
| `node scripts/check-runtime-half-deps.mjs` | 递归 `"./runtime"` 的 import 闭包：禁止编辑器 API / Vue / Element Plus / 相对路径穿越回 `packages/editor/**` |
| `node scripts/check-layer-direction.mjs` | 本包登记在 **Layer 6 编辑器插件**（依赖 editor 是向下，不是向上） |
| `node scripts/check-strict-packages.mjs` | 本包的 `strictNullChecks` 已开并登记 |
| `test/halves.spec.ts` | 反向守门：本包自己的三端声明必须自洽 |

## 测试

```bash
npm run test --workspace @feng3d/editor-plugin-rotate   # 三端各自一组用例
npx tsc --noEmit -p packages/editor-plugin-rotate/tsconfig.json
```

`test/runtime.spec.ts` 里那条「装载后同一个 `__type__` 在游戏端可用」就是
#276 验收③的最小可验证形态：插件引入了新的 `__type__`，于是**第三端不是可选项**。

## 它不是"完成态"

本包是**契约与边界的样板**：宿主进程本身（#272）、插件包的运行时装载与构建期打入产物（#277）
都还没落地（见 [`packages/editor/docs/PLUGIN_TRIPLE_HALF.md`](../editor/docs/PLUGIN_TRIPLE_HALF.md) §3.5）。
真正"把插件包发布出去、宿主装进来、产物带走 runtime 半"要等那两个前置期。
