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

> **功能一律按插件组织**：主界面面板与场景浮层都来自插件清单（[src/plugins/](src/plugins)），
> 核心只认注册表——加一个面板**不需要改** `MainLayout.vue`。清单是纯数据、注册由 `main.ts`
> 显式调用（对齐 R2 零模块级副作用）。详见 [docs/PLUGINS.md](docs/PLUGINS.md)。

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
- **editorui**（[src/global/editorui](src/global/editorui)）— UI 层管理器
- **editorRS** / **editorcache** — 资源系统和缓存管理

### packages 工作区

本包使用 npm workspaces 管理子包：

- `packages/cannon` — Cannon.js 物理引擎集成
- `packages/cannon-plugin` — 物理插件
- `packages/themes` — 主题系统
- `packages/objectview` — 对象视图组件
- `packages/codeeditor` — 代码编辑器
- `packages/typescript` — TypeScript 支持

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
  `node scripts/editor-mcp-check.mjs`（MCP 工具表 ↔ 桥接方法表对齐，离线可跑）、
  `node scripts/editor-mcp-server.mjs`（MCP server）、`node scripts/editor-bridge-cli.mjs`（手动调试）
- **看画面不一定要截图**：`view.probe` 只回像素统计（颜色种类/主色占比/亮度范围/灰度网格，
  几百字节），用来判断"画面上到底有没有东西、改完有没有变化"；确认有变化再用 `view.screenshot`
- **lint**：本包有自己的 `eslint.config.js`（根配置整体忽略了 `packages/editor/**`，且 flat config 的
  `ignores` 无法用命令行绕过），`npm run lint` 现在可以正常执行并已是 0 问题

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
