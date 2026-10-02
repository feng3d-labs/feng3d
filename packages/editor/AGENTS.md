# feng3d-editor 开发规范

本文件是 `packages/editor`（`@feng3d/editor`）子包的开发规范，**只补充根 [AGENTS.md](../../AGENTS.md) 未覆盖的本包专属内容**。
通用规范（纯数据声明式、Logic 类化、响应式 `r_` 前缀、提交规范、测试要求等）一律以根 AGENTS.md 为准，此处不重复。

## 项目概述

feng3d-editor 是基于 feng3d 3D 引擎的可视化编辑器，使用 Vue 3 + TypeScript + Vite 构建。
采用**混合架构**：Vue 3 负责现代 UI 组件，传统 TypeScript 模块负责核心编辑器逻辑。

## 常用命令

```bash
# 开发（必须使用 npm，pnpm 会导致发布失败）
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 单元测试（vitest，纯逻辑放 test/）
npm run test

# 自动修复代码格式
npm run lintfix

# 清理构建产物
npm run clean
```

## 架构概览

> **功能一律按插件组织**：主界面面板、场景浮层、Logic、属性面板控件、桥接方法都来自插件清单
> （[src/plugins/](src/plugins)），界面只认**插槽**（[src/plugins/slots/](src/plugins/slots/)）——
> 加一个面板**不需要改** `MainLayout.vue`。
> **清单是权威数据、插槽是它的投影**（#276 S2b）：清单侧负责层叠加与启用过滤，投影把归并后的赢家
> 摆到座位上；`MainLayout.vue` / `SceneView.vue` 读的是座位（`panel.*` / `scene.overlay`），
> 插件开关一变 → 重投插槽 → `slots/changed` → 界面重算。**只有"渲染位置"那一维交给插槽**：
> `logics` / `objectView` / `bridgeMethods` 留在清单侧（它们写的是引擎注册表与协议方法表）。
> 清单是纯数据、注册由 `main.ts` 显式调用（对齐 R2 零模块级副作用）。
> **不要在模块顶层写 `registerLogic` / `setDefaultTypeAttributeView`**——那是会被门禁
> （`scripts/check-editor-module-effects.mjs`）拦下的；加到清单里
> （`contributes.logics` / `contributes.objectView`）即可。
> 插件可**启用/禁用**（设置 → 插件，或桥接 `editor.setPlugin`）：关掉后它的贡献点到处消失
> （面板 / 浮层 / Logic / 属性控件 / 桥接方法），状态持久化、按已安装状态对账。
> 清单**必须**声明 `apiVersion`（不兼容时当场报错，指出"要什么、现在是什么"）；
> 层序是**内置 < 插件 < 用户**，最上层来自本地**不入库**的 `editor.patch.json`
> （模板 `editor.patch.example.json`，坏 patch 不会拖垮编辑器）。
> 详见 [docs/PLUGINS.md](docs/PLUGINS.md)。

### R2 的适用边界（别把"运行时装载"当成副作用）

根 [AGENTS.md](../../AGENTS.md) §15 的 **R2「零模块级副作用」约束的是核心包**：模块**在 import 时**
不得执行代码——禁止模块级 `new Map()` / `new WeakMap()` / `new Set()`、`register*()` 调用、`globalThis` 写入。
本包对应的门禁是 `scripts/check-editor-module-effects.mjs`（除应用入口外，`src/**` 顶层不得有
`registerXxx` / `setDefaultXxx` 调用）。

**边界在于"谁在什么时候触发"**：

| 形态 | 是否违反 R2 | 说明 |
|---|---|---|
| 核心模块顶层调 `registerLogic(...)` / `setDefaultTypeAttributeView(...)` | **违反** | import 即产生隐式副作用，且无法 tree-shake |
| 应用入口显式调用（`src/vue-app/main.ts` 的 `installBuiltinPlugins()`） | 不违反 | 显式安装点，登记在门禁脚本的入口白名单里，脚本会**反向校验**该登记是否过期 |
| **宿主在运行时装载插件**（cordis loader `import()` 插件包并注册其贡献点） | **不违反** | 宿主**装载插件本来就是运行时行为**，且是**显式注册**——这正是 R2 的**边界之外**，不是 R2 要禁止的东西 |
| 插件 runtime 端（游戏项目端）被打进产物 | **仍须遵守** | 产物要可 tree-shake → runtime 端同样不得有模块级副作用 |

一句话：**R2 管的是"核心包在 import 时的隐式副作用"，不是"运行时不许注册"**。
（这条边界是 [docs/PLUGINS.md](docs/PLUGINS.md) 的 cordis 结论得以反转的前提。）

### 双架构设计

1. **传统 UI 层**（[src/ui/](src/ui)）
   - 早期基于自定义系统的 UI 组件
   - 包括 hierarchy（层级树）、inspector（属性检查器）、assets（资源管理）
   - 直接操作 DOM，不使用 Vue

2. **Vue UI 层**（[src/vue-app/](src/vue-app)）
   - 基于 Vue 3 + Element Plus 的新 UI 系统
   - 使用组合式 API（Composables）
   - 与传统 UI 共享状态和事件系统

### 核心模块

- **Editor.ts** — 编辑器主入口，负责初始化各层和模块
- **Modules.ts** — 模块管理器，维护编辑器各功能模块的引用
- **EditorData** — 全局编辑器数据，存储当前场景、选中对象等状态
- **editorui**（[src/global/editorui](src/global/editorui.ts)）— UI 层管理器
- **editorRS** / **editorcache** — 资源系统和缓存管理

### 插件是三端包（triple-half）与 VS Code Web

**插件不只是"编辑器的插件"**：目标形态是**三端包**——同一份插件包在三端各有一个入口
（[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §6.6，D4）：

| 端 | 形态 | 现状 |
|---|---|---|
| **编辑器 Node 端**（宿主） | 宿主侧服务 / 命令，cordis 插件（包入口 `"."`） | **契约与样板已立**（#276 阶段 3）：`feng3d-editor` 的宿主侧公开面 `src/host/` + 样板包 `@feng3d/editor-plugin-rotate` 的宿主半；**宿主进程本身待 #272** |
| **编辑器 Web 端** | 贡献点（面板 / 浮层 / Logic / 属性控件 / 桥接方法），包入口 `"./client"` | **已成型**：`feng3d-editor/client` 是插件界面侧的公开入口，界面读**插槽**（`src/plugins/slots/`） |
| **游戏项目端**（runtime） | 在游戏产物内运行，包入口 `"./runtime"`；**只能依赖引擎 API（feng3d），禁止依赖编辑器 API** | **已完成**（#276 阶段 3/6）：`check-runtime-half-deps.mjs` **真扫**样板包；`check-runtime-artifact.mjs` 在**产物级**验"启用进产物、未启用不进、无编辑器依赖且能跑"；真实 `build`/`publish` 接到项目构建流程属 #277 其余任务 |

两条通道**别混为一条**：编辑器 Node 端 ↔ Web 端是**实时通道（WebSocket）**；
编辑器 → 游戏项目端是**产物通道（文件级契约）**——游戏端**不连 WebSocket**，离线运行、只读产物。
**只要插件引入了新的 `__type__`，第三端就不是可选项**（编辑格式 = 运行格式，D1）：两端都要注册对应 Logic。

**VS Code Web**：文件树 / 脚本编辑 / 终端 / Git / 全局搜索交给 **VS Code Web**（D11），
editor Web **不再做文件管理**，专注 3D 场景、属性配置、产物生成入口与插件管理；
内嵌的 `packages/codeeditor` **可废弃**。
两者界面关系（两个并列页面 / 一方嵌入另一方 / 把场景视图做成 VS Code 自定义编辑器）**属未决策项**
（[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §11 问题 14）。

### packages 工作区（**已按实际更正**，见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §6.10）

> **更正**：本节原先声称"本包使用 npm workspaces 管理子包"，并列出 `cannon` / `cannon-plugin` /
> `themes` / `objectview` 等目录——其中多个**已不存在**，且"workspaces 管理"与**实际不符**：
>
> - 根 `package.json` 的 `workspaces` 是 `["packages/*", "packages/*/examples", "examples"]`，**不递归**，
>   所以 `packages/editor/packages/*` **不在任何 workspace 内**；
> - `packages/editor/package.json` **没有 `workspaces` 字段**；
> - **后果**：这些子包**既不参与 `npm i` 安装，也不参与发布**。
>
> 目录现状（`packages/editor/packages/`）：
>
> | 目录 | 现状 |
> |---|---|
> | `native/` | `NativeFSBase.js`（基于 `fs-extra` 的 Node FS 实现）+ package.json；`main: index.js` 指向**不存在的文件** |
> | `typescript/` | 有源码、**没有 package.json → 不可发布**；全仓无引用 |
> | `codeeditor/` | Monaco 独立窗口（`window.opener` / AMD / DOM），`private: true`；D11 后可废弃 |
> | `editor/` | **空目录**（无 package.json、无入口） |
>
> 它们**是收进 workspace 还是就地删除重写，属未决策项**（[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §11 问题 9），
> 本文不替它下结论。上文「核心模块」与「架构概览」讲的单例 / 贡献点机制都在
> `packages/editor/src/**`，**与这四个子包无关**。

### 构建配置

- **多入口构建**：index.html（编辑器主界面）、run.html（运行预览）
- **外部依赖**：feng3d 及相关插件通过 CDN 加载，**不打包进 bundle**
- **静态资源**：resource/ 目录在构建时复制到 public/
- **类名保持**：esbuild 配置 `keepNames`，避免类名被压缩修改

## 代码规范（本包补充）

### Vue 组件

- **逻辑抽离**：`.vue` 文件只保留 template，TypeScript 逻辑抽离到同名 `.ts` 文件
- **样式抽离**：CSS 放在 `styles/` 目录独立文件
- **组合式函数**：使用 `useXxx` 命名的 composables 封装逻辑
- **响应式对象**：命名以 `r_` 开头（如 `r_owner`）；不传入函数参数、不导出；仅在需要 `computed`/`watch` 时使用，并在组件或 composable 内部创建

### VSCode 主题

- 所有颜色变量由 `ThemeService` 从 VSCode 主题文件动态加载
- **不在 CSS 中硬编码** VSCode 主题颜色
- 变量名直接对应 VSCode 原始 key（如 `button.background` → `--button-background`）

### TypeScript

- 变量和函数用 camelCase，类和接口用 PascalCase
- 避免 `any`（eslint 规则虽允许，本包规范不建议）
- 公共 API 必须加 JSDoc，复杂逻辑必须加中文注释
- 临时方案或待优化代码必须加 TODO 注释
- **cordis 服务的例外**：写成 cordis `Service` 的类，状态用 TS `private` 而**不是** `#field`
  ——服务代理会让 `this` 变成 Proxy，而 JS 私有字段无法透过 Proxy 访问
  （实测 `TypeError: Cannot read private member … whose class did not declare it`）。
  这是本包唯一一处偏离根 AGENTS.md §3「私有状态用 #field」的地方；
  三条硬约束详见 [docs/PLUGIN_TRIPLE_HALF.md](docs/PLUGIN_TRIPLE_HALF.md) §3.7「S4a 落地时撞到的三条 cordis 硬约束」

### 配置文件结构

`vite.config.js`、`test_vite.config.js` 等按以下顺序组织：

1. 文件头部：导入语句、配置变量
2. 主要执行逻辑（如 `export default defineConfig()`）
3. 文件尾部：辅助函数与工具函数定义

### 模块组织

- 优先命名导出，避免默认导出，避免不必要的导出
- 每个文件不超过 300 行，职责单一
- 相关功能组织在同一目录下
- 渲染管线、Shader、资源管理代码分离到专门目录/文件

## 开发注意事项

1. **依赖安装**：必须用 `npm i`，**pnpm 会导致发布失败**
2. **外部依赖**：feng3d 等核心库不打包，通过 CDN 加载
3. **lint 检查**：提交前必须通过 lint（max-warnings 0）
4. **右键菜单**：编辑器禁用了默认右键菜单
5. **端口**：开发端口从 `vite.config.js` 读取（默认 3000）
6. **临时文件**：截图与调试文件统一放 `.temp/` 目录，用时间戳前缀命名，不入库

## 关联地址

- 仓库：https://github.com/feng3d-labs/editor
- 线上部署：https://feng3d-labs.github.io/editor/

---

## 开发流程规范

### 紧急停止条件（最高优先级）

> **用户明确的指令永远优先于任何流程。**

当用户发出以下任何指令时，**立即停止当前所有操作**：

- 「提交代码」→ 立即提交当前修改，之后不再改动代码
- 「够了」「不要修改了」「停手」「先这样」「不要胡乱修改」「还原」
- 任何形式的拒绝/否定语言

违反此规则是严重错误，必须绝对避免。

### Bug 修复流程

**核心口诀：理解 → 还原 → 最小改 → 一次验 → 精简 → 停手**

| 阶段 | 要点 |
|---|---|
| 一、问题诊断 | 先完整理解问题，不急于改代码；区分 DOM/CSS、3D 渲染、逻辑、数据流四类；收集 DOM/样式/Canvas/控制台错误，对比正常态与故障态 |
| 二、定位原因 | 历史回溯（代码是否被改过）；每次修改前先读文件确认当前状态 |
| 三、还原与最小修改 | 先还原到原始问题状态；一次只改一个问题点；确认每个改动都必要，去掉无关改动 |
| 四、验证 | 改完验证**一次**即可，不要反复刷新（避免触发重载）；优先用脚本化方式取数据（Playwright `page.evaluate`）而非反复截图 |
| 五、停止 | 问题解决后不再触碰代码，等待用户确认或下一步指示 |

### 浏览器自动化测试

```bash
# 检查是否已安装
npm list playwright

# 未安装则安装
npm install -D playwright
npx playwright install chromium
```

基础截图与错误检测模板：

```javascript
const { chromium } = require('playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];

    page.on('console', (msg) => { if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() }); });
    page.on('pageerror', (err) => { errors.push({ type: 'page', message: err.message }); });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log(`错误数量: ${errors.length}`);
    await page.screenshot({ path: '.temp/screenshot.png' });
    await browser.close();
})();
```

本项目特定的元素定位（通过 title 属性）：`设置`、`帮助`、`二维码`。

### GitHub Issues 修复流程

```
获取 Issue → 创建分支 → 修复 Bug（遵循 Bug 修复流程）→ 提交 → 推送 → 创建 PR → 评论交互 → 合并 → 清理
```

1. **获取 Issue**：读取 issue 内容，理解问题描述
2. **创建分支**：`fix/issue-{编号}` 或 `feature/issue-{编号}`
3. **修复 Bug**：严格遵循上方 Bug 修复流程六阶段
4. **提交**：`fix: #{编号} 简短描述`（或 `feat` / `docs`）
5. **推送**：`git push -u origin fix/issue-{编号}`
6. **创建 PR**：用 `gh pr create`，PR 描述包含「问题描述 / 修复方案 / 测试清单」
7. **评论交互**：回复 issue 告知已提交 PR 并附可点击链接
8. **响应 review**：根据评论修改；补充修改在同一分支上 `git commit --amend --no-edit` + `git push -f`，**不要新建 PR**
9. **合并**：review 通过后 `gh pr merge --squash`（或 `merge` / `rebase`）；不要催促合并
10. **清理**：`git checkout master && git pull && git branch -d fix/issue-{编号}`

> **只有修复 Issues 中的问题时才创建 PR。** 紧急停止条件同样适用于此流程。

### 交互规范

- 需要用户决策时，**用 `ask_user_question` 工具提供可选项**，不要要求用户打字回复
- 修改原则：一次只改一个问题点 → 改完立即验证 → 无效则回滚再试下一个方案 → 最终保留最小修改集

---

## AI 桥接（编辑器可由 AI 直接操作）

编辑器内置一条 **AI 桥接通道**，让 AI（DSH 的 MCP 工具 / CLI）以语义化方式查询与操作场景，
不必靠 DOM 选择器模拟点击，也不必把整个场景 JSON 塞进上下文。

- **实现**：[src/bridge/EditorBridge.ts](src/bridge/EditorBridge.ts)（轮询循环 + 方法总表 + 错误回传）
  + [src/bridge/read/](src/bridge/read/)（只读方法，按职责分文件：`readCore` 共享工具
    （含 write 侧也依赖的 `requireSceneRoot`/`getObjectId`/`resolveObjectId`/`MAX_TREE_DEPTH`）/
    `sceneRead` 场景查询 / `sceneQuery` 检索 / `sceneValidate` 体检 / `viewRead` 截帧与像素统计 /
    `viewProject` 投影工具 / `editorRead` 编辑器交互）
  + [src/bridge/write/](src/bridge/write/)（写方法：`writeCore` 撤销栈与历史 /
    `writeGuards` 路径与数值校验 / `writeSet` / `writeMaterial` / `writeGeometry` / `writeObject` /
    `writeTree` / `writeMisc`；[src/bridge/EditorBridgeWrite.ts](src/bridge/EditorBridgeWrite.ts)
    是事务入口 `scene.batch` 与方法总表）
  + [bridge/vitePlugin.mjs](bridge/vitePlugin.mjs)（dev server 中间件，RPC 端点）
  + [scripts/editor-mcp-server.mjs](../../scripts/editor-mcp-server.mjs)（MCP server）
  + [scripts/editor-bridge-cli.mjs](../../scripts/editor-bridge-cli.mjs)（CLI，便于手动调试）
- **文档**：[docs/EDITOR_AI_BRIDGE.md](../../docs/EDITOR_AI_BRIDGE.md)——协议、方法表、已知限制，
  以及 **§13 AI 工作流建议**（规划操作顺序时先看它）
- **自检**：`node scripts/editor-bridge-smoke.mjs` 覆盖全部方法（写操作测完自动撤销还原）。
  改动桥接代码后请跑一遍，它会直接指出哪一项坏了
- **其它自检**：`node scripts/editor-bridge-fuzz.mjs`（非法/边界输入 + 合法操作序列）、
  `node scripts/editor-bridge-scenario.mjs`（集成验收：从零搭一张桌子并验证）、
  `node scripts/editor-e2e-scene.mjs --open`（端到端验收：搭场景 + 导出→导入**往返等价**；
  自己开页面，已进 CI；无 GPU 时像素判据跳过）、
  `node scripts/editor-bridge-stress.mjs`（206 个对象的耗时基线）、
  `node scripts/editor-plugins.mjs --open --check`（插件贡献表自洽：贡献点都有来源、id 唯一、
  落位已知、**禁用插件的贡献点不在表里**；已进 CI，「界面上这个东西是哪来的」也靠它回答）、
  `node scripts/editor-slots.mjs --open`（**插槽驱动的界面**：关掉一个面板插件后界面标签必须少一个、
  恢复后回来；验的是「清单变了界面真的跟着变」那一段 `slots/changed → MainLayout`，纯函数测试覆盖不到；
  已进 CI）、
  `node scripts/editor-plugin-load.mjs --open`（**运行时装载**：不重新构建就把插件包装上——
  从真插件包导入 client 半 → 核声明 → 登记清单 → 重投插槽 → 界面标签真的多一个，卸载后回来。
  #276 验收②的守门人；**单测覆盖不到它**：浏览器原生 ESM 不解析裸包名，
  说明符要由入口图给出可解析形式，见 `src/plugins/loader/moduleTable.ts`）、
  `node scripts/editor-mcp-check.mjs`（MCP 工具表 ↔ 桥接方法表对齐，离线可跑）、
  `node scripts/editor-run-preview.mjs --url <dev server>`（**运行形态**（#271 P0 的第三条断链路）：
  打开 `run.html` → 纯数据场景读出来装进视图（`objects > 0`）→ 渲染循环**真的在提交帧**
  （`frames > 10`，这是**确定性**判据：画面里有没有物体取决于场景数据，见下）→ 不再请求废掉的
  `project.js`。无 GPU 的机器上按"环境限制"记，但要求 **WebGPU 失败被如实报出**，不许静默成功。
  画面只**存档**到 `packages/editor/.temp/run-preview.png` 供人工确认——像素硬判据要么得引图像库、
  要么会在无 GPU 的 CI 上误报）、
  `node scripts/check-editor-host.mjs`（**宿主门禁**（#272 P0）：进程入口登记 + 反向校验、
  依赖方向 R1（宿主是最上层，不许 import Vue / Element Plus / 引擎，也不许相对穿越到 `src/**`）、
  服务级能起能停（`ctx.fiber.dispose()` 后端口释放）、进程级能报版本能起停；离线可跑）、
  `node scripts/check-bridge-relay.mjs`（**桥接中继协议验收**（#273 第一阶段）：起真宿主进程，
  把"调用方 → 页面 → 调用方"的往返走一遍——完整往返 / 派发即移除 / 长轮询被唤醒 / 定向投递 /
  错误路径 / 非桥接路由仍走静态资源。它守的是"dev 与生产共用同一命令层"
  （`bridge/relay.mjs`），15 个 `editor-*.mjs` 都建立在这套协议上；离线可跑）、
  `node scripts/check-bridge-socket.mjs`（**WebSocket 通道验收**（#273 第二阶段）：页面连上后
  调用方一发起就**被推送**到任务（不是轮询）、**推送即派发**（不会经 HTTP 轮询重复执行）、
  HTTP 调用也能推给 WS 页面（**两条通道共用同一份命令层**）、`/ping` 能看到 WS 页面、
  坏输入不断连接、先有调用后有页面时**积压不丢**；离线可跑）、
  `node scripts/editor-bridge-ws-page.mjs --url <dev server>`（**页面侧 WS 端到端**（#273 第三阶段）：
  打开真页面 → `/ping` 里必须出现 `transport: websocket`（**页面自己说连上不算，服务端记到才算**）→
  用 **HTTP** 发起调用，由 WS 页面执行并把结果回传（跨通道证明同一份命令层）→
  退路（不经 WS）照旧可用；需 dev server 在跑）、
  `node scripts/check-editor-workspace.mjs`（**项目工作区服务验收**（#272 P2）：宿主的"碰文件"那一半。
  重点是**边界**——绝对路径、`..`、`sub/../../`、空路径全部必须被拒（宿主是 Node 进程，
  "打开的目录"没边界就等于把整台机器交出去）；另有读写 / 自动建父目录 / 列目录 / 变化事件 /
  关闭后拒绝 / **`ctx.fiber.dispose()` 收走 watcher**；跑在真 cordis `Context` 上，离线可跑）、
  `node scripts/check-editor-boot.mjs`（**入口图注入验收**（#276 任务 4 的宿主半）：没有插件配置
  就不注入、有配置就注入到 `</head>` 之前、**裸包名被拒**（浏览器原生 ESM 解析不了——阶段 4 踩到的坑
  在这里钉成判据）、坏配置只丢那一条；离线可跑）、
  `node scripts/editor-plugin-host-load.mjs`（**宿主装载端到端**（#276 验收②的正面证据）：
  起宿主 + 真构建产物 + esbuild 打的真插件包 → 界面出现插件贡献的面板、内置面板一个不少、
  零 pageerror。需要先构建产物，或加 `--build` 自动构建）、
  `node scripts/check-editor-module-effects.mjs`（模块级注册副作用门禁：除应用入口外
  `src/**` 顶层不得有 `registerXxx` / `setDefaultXxx` 等调用；离线可跑，已进 CI）、
  `node scripts/check-runtime-half-deps.mjs`（**插件 runtime 端只能依赖引擎 API**：第三端会被打进
  游戏产物，import 编辑器 API / Vue / Element Plus、或相对路径穿越到 `packages/editor/**` 即失败；
  样板包 `@feng3d/editor-plugin-rotate` 已被**真扫**；另带 8 条合成样例自检；离线可跑，已进 CI）、
  `node scripts/check-runtime-artifact.mjs`（**runtime 端产物通道**（#277 任务 1+2 的最小一截，
  也是 #276 验收③的产物侧证据）：按"项目启用了哪些插件"生成入口 → 打包 → **在无编辑器环境跑产物**
  （`logic().update(1) === 90`）、未启用插件的 runtime 端**不进产物**（带方法自证）、
  产物不含编辑器标记；离线可跑）、
  `node scripts/editor-mcp-server.mjs`（MCP server）、`node scripts/editor-bridge-cli.mjs`（手动调试）
- **看画面不一定要截图**：`view.probe` 只回像素统计（颜色种类/主色占比/亮度范围/灰度网格，
  几百字节），用来判断"画面上到底有没有东西、改完有没有变化"；确认有变化再用 `view.screenshot`
- **lint**：本包有自己的 `eslint.config.js`（根配置整体忽略了 `packages/editor/**`，且 flat config 的
  `ignores` 无法用命令行绕过），`npm run lint` 现在可以正常执行并已是 0 问题

### 读「选中对象」的纪律（必读，issue #173 的教训）

**不要自己 `globalEmitter.on('editor.selectedObjectsChanged', …)`**——一律用
`src/vue-app/composables/useSelectionSync.ts`。

原因：读选中的消费者（检查器 / 层级树 / 资源管理器 / 相机预览 / 动画 / 粒子控制器）都是
**异步加载**的组件，"选中变化"却是一次性事件——**在组件挂载之前发生的选中，它永远收不到**。
慢机器上的表现就是「点了层级树、检查器一直显示未选择对象」，而且**不会自愈**：
再点同一个对象时 `setSelectedObjects` 认为选中没变、不再发事件。

`useSelectionSync` 把两件事绑在一起：**先订阅（setup 期）+ 挂载时补一次当前选中**
（回调读的是当前值，所以重复调用是幂等的），并用同一个函数引用取消订阅
（旧层级树那版用新箭头函数 `off`，**取消不掉**，每次重挂载都多留一个监听器）。

非 Vue 的类（`Hierarchy` / `MRSTool` / `MRSToolTarget`）用不了 composable，手写同一条纪律
（订阅后补一次），并登记在 `test/selectionSync.spec.ts` 的白名单里——那条用例会拦住新的裸订阅，
也会检查白名单条目是否还带着"补一次"的自证。

改动这些面板后请跑 `node scripts/editor-selection-sync-check.mjs --open`
（选中 → 关掉面板 → 开回来，面板必须自己恢复，而不是空着；已进 CI 的 `editor-e2e` job）。

改**引擎侧响应式**（`Container` / `Object3D` 的 parent 链、`worldMatrix` 一类 computed）后，请跑
`node scripts/editor-scene-view-cycle.mjs --open`：反复关/开「场景」面板（= 卸载/重建场景视图）三轮，
不该出现 `RangeError: Maximum call stack size exceeded` 或 `reading 'elements'` 这类引擎侧报错
（issue #177；已进 CI 的 `editor-e2e` job）。

### 改桥接代码时的四条纪律

1. **改完必须实测**：桥接调用成功 ≠ 场景没问题。用 `view.screenshot` 看画面、`log.tail`
   查报错、`scene.validate` 查隐性损坏——「背景色改对了、物体却全黑」就是靠日志才定位的。
   根 AGENTS.md 第 1 章要求"改代码后检查运行日志"，在编辑器里对应的就是桥接的 `log.tail`
   （读的正是控制台缓冲，与用户在控制台面板看到的同一份）；写操作还会把本次调用期间新出现的
   报错作为 `newLogErrors` 直接带回来
2. **代理与原始对象必须先 `toRaw` 再比较**：`logic(x).parent`、`reactive(x).children` 拿到的
   可能是代理，与原始对象用 `===` / `indexOf` 都会失配——轻则「该删的没删」，重则防环检查失效、
   场景树成环、递归爆栈把页面卡死
3. **路径式 id 只覆盖游戏场景**：`editorViewRoot` 这类编辑器层对象寻址不到。需要它们时直接
   持有对象（如 `getActiveEditorView()`），不要绕 id——早期实现会静默返回场景根，写入落到
   不相干的对象上
4. **守卫要用语义判据，别依赖对象身份**：要拦"场景根"，最稳的是判**路径深度**（id 只有一段）。
   用"有没有父级"会失效（游戏场景根挂在视图 root 下、是有父级的），用"对象是否相等"在本包里
   也出现过判断不生效——两者都让 `remove`/`reparent`/`group` 把**整棵场景**移出了视图
