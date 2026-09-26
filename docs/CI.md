# CI 与发布流程

本文件说明本仓库的持续集成与 npm 发布机制。**改动 CI 配置、发布脚本或子包发布字段时，请同步本文件。**

> 相关文件：
> - [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) —— PR / 推送的质量门禁
> - [`.github/workflows/release.yml`](../.github/workflows/release.yml) —— 推 tag 发布到 npm
> - [`scripts/release-packages.mjs`](../scripts/release-packages.mjs) —— 发布编排（可本地跑）
> - [`scripts/run-in-packages.mjs`](../scripts/run-in-packages.mjs) —— 逐包执行 npm 脚本
> - [`vitest.config.ts`](../vitest.config.ts) + [`vitest.setup.ts`](../vitest.setup.ts) —— 单元测试范围与全局补齐

---

## 1. 单元测试覆盖范围

CI 用根 `vitest run` 一次跑完全仓测试：

| 范围 | 说明 |
|---|---|
| `packages/feng3d/src/**/*.spec.ts` | 引擎主包测试与源码同目录（该包无独立 `test/`） |
| `packages/*/test/**/*.spec.ts` | 其余 18 个子包的测试 |
| `test/**/*.spec.ts` | 仓库级脚本的测试（发布版本决策 `release-version.mjs`、Release 正文生成 `release-notes.mjs` 等） |

**当前基线：78 个测试文件 / 730 个测试用例全部通过。**

### 1.1 shortcut 与 terrain 曾经被排除

这两个子包原先写在 `vitest.config.ts` 的 `exclude` 里，理由是「依赖浏览器 / WebGPU 全局」。后果是**它们从未在 CI 里跑过**——测试文件在，但门禁看不到。

现在由 [`vitest.setup.ts`](../vitest.setup.ts) 补齐所需全局，两者纳入全量：

| 缺失全局 | 用途 |
|---|---|
| `self` + `addEventListener` / `removeEventListener` / `dispatchEvent` | `@feng3d/shortcut` 的 `WindowEventProxy` 在模块顶层 `new EventProxy(self)`，`on()` 随即对 `self` 注册监听 |
| `MouseEvent` / `KeyboardEvent` / `WheelEvent` | shortcut 用 `instanceof` 区分输入类型（`KeyState.pressKey`、`EventProxy.onMouseKey`） |
| `GPUBufferUsage` 等 WebGPU 常量表 | `@feng3d/webgpu` 的 class static field 在 import 期读这些常量 |
| `GPUTexture` / `GPUBuffer` 类 | `@feng3d/webgpu` 加载时 monkey-patch `GPUTexture.prototype.createView` |
| `ImageData` | feng3d 的 `ImageUtil` 在模块加载期构造占位默认纹理 |

两点约定：

- **`self` 用真实事件派发而不是 no-op**。no-op 会让「监听器注册了却从不触发」这类缺陷表现为通过。
- **不要定义 `window`**。部分模块用 `typeof window === 'undefined'` 作为「非浏览器环境」守卫（见 `packages/addons/test/browser-stub.ts` 的注释），定义 `window` 会让守卫失效并走进浏览器专属分支。

`packages/feng3d/src/test/webgpu-stub.ts` 仍保留独立副本，因为它被 12 个 spec 直接 `import`，单包内单独跑测试时也要成立。两处都用 `typeof === 'undefined'` 守卫，先到先得，不会互相覆盖。

### 1.2 类型检查为什么不用 `--workspaces`

根 `package.json` 的 `workspaces` 除 19 个包外还包含示例工作区（`examples`、`packages/<包>/examples`），其中 `feng3d-reactivity-examples` 与 `webgpu-examples` 有**既有类型错误**：

- `reactivity/src/arrayInstrumentations.ts` 用了 `toReversed` / `toSorted`，示例的 `lib` 未含 es2023
- `webgpu/src/utils/*` 用了 `WeakRef`，示例的 `lib` 未含 es2021
- `webgpu/examples/src/webgpu/skinnedMesh/glbUtils.ts` 里 `string` 未收窄为 `GPUIndexFormat` / `GPUVertexFormat`

所以 CI 走 `types:packages` / `build:packages`（由 `scripts/run-in-packages.mjs` 只跑 `packages/<包>` 一层）。示例的类型收敛是独立事项，见 §6。

---

## 2. CI 工作流（`.github/workflows/ci.yml`）

触发：推送到任意分支、PR、手动触发。tag 推送交给 release 工作流，避免同一提交跑两遍。

### 2.1 质量门禁 job

| 步骤 | 命令 | 作用 |
|---|---|---|
| 代码检查 | `npm run lint:ci` | eslint，**零警告**门禁 |
| 单元测试 | `npm run test:run` | 全量 78 个测试文件 / 730 个测试用例 |
| 类型检查 | `npm run types:packages` | 19 个包的 `tsc`（各包 tsconfig 为 `noEmit`，故等价类型检查） |
| 构建校验 | `npm run build:packages` | 同上，确保 `build` 脚本可用 |
| 发布产物预演 | `npm run release:dry-run -- --force` | 构建 + `npm pack` + **内容校验**，不发布 |
| 工作区污染检查 | `git status --porcelain` | 构建若改动了受版本控制的文件则失败 |

「发布产物预演」这一步的价值：`npm pack` 与 `npm publish` 走同一套打包逻辑，所以能在 PR 阶段就发现「包里少了入口文件」这类**发布成功但完全不可用**的缺陷（见 §4.1 的真实案例）。

`--force` 让「版本已发布过」的包也走一遍打包校验；该参数被限制为只能配合 `--dry-run` 使用（npm 不允许覆盖已发布版本）。

### 2.2 编辑器 job

`packages/editor` 在根 eslint 配置里被整体忽略（它有自己的 `eslint.config.js`）且根配置的 `ignores` 无法用命令行绕过，因此单独一步：

| 步骤 | 命令 | 是否门禁 |
|---|---|---|
| 编辑器 lint | `npm run lint --workspace feng3d-editor` | 是 |
| 编辑器类型检查 | `npm run type-check --workspace feng3d-editor`（vue-tsc） | **否**（见下） |

**`lint:ci` 依赖先构建 `eslint-plugin-feng3d`**：根 `eslint.config.js` 里
`import feng3dPlugin from 'eslint-plugin-feng3d'` 解析到该包的 `dist/index.js`，
而 `dist/` 在 `.gitignore` 中、干净检出后并不存在。因此 `lint:ci` 配了 `prelint:ci`
前置脚本先执行 `npm run build --workspace eslint-plugin-feng3d`。漏掉这一步时，
CI 会以 `ERR_MODULE_NOT_FOUND: Cannot find module .../node_modules/eslint-plugin-feng3d/dist/index.js`
失败——本地因为早已构建过 `dist/` 而看不出来，只有干净检出才暴露。

**编辑器类型检查为什么不算门禁**：editor 通过 workspace 链接 import 的是
`feng3d` / `polyfill` 的**源码**（不是 `.d.ts`），vue-tsc 会顺着 import 深检这些库的
源码，报出的是它们既有的类型错误，例如：

- `packages/feng3d/src/core/View.ts` —— canvas 断言与 `HTMLCanvasElement` 不匹配
- `packages/feng3d/src/materials/StandardMaterial.ts`、`TextureMaterial.ts` ——
  `TextureField` / `Texture | TextureResource` 收窄
- `packages/polyfill/src/ClassUtils.ts` —— 未使用的 `@ts-expect-error`

这些在库自己的 `tsc` 下不出现（其 tsconfig 关闭了 `strictNullChecks` 等 4 项），
也不是 editor 自身的问题。因此该步骤保留执行、把错误摘要写进日志，但不让门禁变红，
避免「长期红着、真问题被掩盖」。库源码的类型收敛是独立事项（见 §6）。

### 2.3 编辑器浏览器 e2e job

`npm run test:e2e:editor`（配置：`playwright.editor.config.ts`）。它**测构建产物**而不是 dev server：起包内静态服务器（等价于用户 `npx feng3d-editor`），因为「产物加载失败 → 白屏」这类缺陷在 dev 下会被 vite 的裸导入解析掩盖。

**为什么断言只覆盖「加载层错误」**：CI 是 ubuntu headless、**没有可用 GPU**，实测会连锁报出
`WebGPU device was lost: Device was destroyed.` → `提交渲染失败：RangeError ... createBuffer`
→ `Maximum call stack size exceeded`。这些在本地（有 GPU）不出现，属环境差异。

所以用例只匹配模块解析失败 / 资源 404 / 脚本执行异常这类**加载层**错误，GPU 渲染层的问题单独立项跟踪（见 §6）。若把整串错误都设成门禁，用例会在 CI 上恒红，反而掩盖真正的产物缺陷。

有效性靠**破坏性验证**保证（门禁最怕「永远绿」）：把产物入口 JS 指向不存在的文件后，用例立刻变红。注意这里有个反直觉点——**移除 importmap 不会让用例变红**，因为 feng3d 已内置进产物（#145 的修复），产物不再有该裸导入；所以验证「用例有效性」要用真正切断加载的方式。

---

## 3. 发布流程（`.github/workflows/release.yml`）

### 3.1 怎么发

```bash
git tag v0.6.1
git push origin v0.6.1
```

推 tag 即发布。tag 同时充当**发布记录**和**目标版本来源**（也接受不带 `v` 的 `0.6.1` 形式）。

也可以用 Actions → Release → Run workflow 手动触发，可勾选「仅预演」与「保证每个子包都发出新版本（`--bump-all`，见 §3.2.1）」。无论推 tag 还是手动触发，**发布前都会用同一组版本参数先跑一遍预演**，确保预演出的版本分配就是实际要发的。

### 3.2 版本语义

本仓库历史上各包独立发版（`feng3d` 0.9.0、`@feng3d/reactivity` 1.0.13、`@feng3d/path` 0.0.8…），因此**不强制统一版本号**。默认策略是「只升不降」：

1. tag 版本是「本次目标版本」：包的当前版本低于目标版本才抬到目标版本；已高于目标版本的包保持原版本不动（不把 `@feng3d/reactivity` 从 1.0.13 降回 0.6.1）。
2. 抬版后逐个比对 npm registry：**版本已存在则跳过**。因此重复推同一个 tag 是幂等的，只有真正的新版本会发布。
3. 首次发布（registry 上查不到该包名）按目标版本发布，并在摘要里标出 `（首次发布）`。
4. **拒绝降级**：若选定版本低于该包在 npm 上的 `latest` 标签，默认策略下会先告警、正式发布时直接失败。因为那会让 `npm i <包名>` 装到的版本倒退、`latest` 标签被往回推。确认无误要强行发布时加 `--allow-downgrade`。
5. **推 tag 时固定按 `--bump-all` 语义发布**（见 §3.2.2）。手动 `workflow_dispatch` 仍由输入勾选控制。

> 由于规则 1，`git tag v0.6.1` 时 `@feng3d/path` 会从本地的 0.0.3 抬到 0.6.1 发布——本地版本落后于 npm 上的 0.0.8，抬到批版本号是预期行为。

> **推 tag 时实际走的是规则 5**（固定带 `--bump-all`），因为本仓库各包本地版本普遍落后于 npm，只按规则 1 会让规则 4 把整条 tag 路径拦死。细节见 §3.2.2。

### 3.2.1 `--bump-all`：保证每个包都发出新版本

默认策略下，版本已被占用的包会被跳过。若你希望**每个子包都发出去**（例如 `@feng3d/reactivity` 本地 1.0.12、npm 上已是 1.0.13，默认会跳过），加 `--bump-all`：

```bash
npm run release:packages -- --tag v0.6.1 --bump-all
# 先预演确认版本分配
node scripts/release-packages.mjs --dry-run --bump-all --tag v0.6.1 --no-build
```

它对每个包取 `base = max(本地版本, npm latest 标签, 目标版本)`：`base` 未被占用就直接用，否则沿该包自己的版本序列递进 patch 直到找到空位。

**为什么基准是 `latest` 标签而不是「版本号最大值」**：本仓库发过格式混乱的历史版本号。`feng3d` 在 npm 上有 91 个版本，其中包括 `201810.3.0` 这类日期式版本号——它在语义化比较里高于 `0.9.0`，而 npm 上的 `latest` 是 `0.9.0`。若按最高版本取基准，会算出 `201810.3.1` 并让 `latest` 从 0.9.0 跳过去，版本号体系直接失控。`latest` 代表「用户 `npm i` 实际装到的版本」，是唯一可靠的锚点。

实际效果（`--tag v0.6.1` 下的预演）：

| 包 | 本地 | npm latest | `--bump-all` 结果 |
|---|---|---|---|
| `@feng3d/math` | 0.6.0 | 0.8.4 | **0.8.5**（latest 已被占用，递进） |
| `feng3d` | 0.6.0 | 0.9.0 | **0.9.1**（不会跳到 201810.x） |
| `feng3d-editor` | 0.6.0 | 0.7.0 | **0.7.1** |
| `@feng3d/webgpu` | 0.1.0 | 0.1.4 | **0.6.1**（目标版本高于 latest，抬到目标版本） |
| `@feng3d/addons` | 0.6.0 | （未发布） | **0.6.1**（首次发布按目标版本） |

两条保护：

- **绝不降级**：结果永远不低于 `latest`，否则依赖方 `npm i` 拿到的版本会倒退。
- **不覆盖已有版本**：结果必定是 registry 上不存在的版本（否则 npm 会拒绝发布）。

预演时会逐包打印版本来源，便于核对：

```
  - @feng3d/event@0.8.5    （0.8.4 已被占用，递进到 0.8.5）
  - @feng3d/webgpu@0.6.1   （本地版本 0.1.0 落后，抬到目标版本 0.6.1）
  - @feng3d/addons@0.6.1   （@feng3d/addons 尚未发布过，按 0.6.1 首次发布；首次发布）
```

注意 `--bump-all` 会**写回 package.json 的版本号**（发布脚本在 `finally` 里还原成发布前内容，所以工作区不会被污染，但下一次仍会基于仓库里的旧版本号重新计算并再次递进）。若要长期使用，建议把选定的版本号正式提交进各包 `package.json`。

### 3.2.2 推 tag 为什么固定带 `--bump-all`

这是踩出来的：`git tag v0.6.2 && git push origin v0.6.2` 会**整条失败**。

推 tag 触发的工作流没有任何输入参数可用，走的是默认策略；而默认策略只比较「本地版本 vs tag 版本」、**不看 registry**：

```
本仓库现状：各包本地版本 0.6.0（`packages/*/package.json`），
            而 npm 上 latest 已到 0.8.x / 0.9.x（上一批发布推上去的）
tag v0.6.2 → 绝大多数包选定 0.6.2 → 低于它们各自的 latest
           → 触发规则 4「拒绝降级」→ 发布中止
```

实测一次性报出 13 条降级告警（`@feng3d/assets`、`@feng3d/math`、`feng3d`、`feng3d-editor`…），也就是说**「推 tag 发布」这条最主要的使用路径根本走不通**。

修法是让推 tag 固定按 `--bump-all` 语义发布：以 `max(本地版本, npm latest, tag 版本)` 为基准，只在该包自己的版本序列上递进 patch。既不降级（`latest` 不会回退），也不跳版（`feng3d` 是 0.9.2 而不是 201810.x）。手动 `workflow_dispatch` 仍由输入勾选控制，两条路径的预演与正式发布都用同一组参数。

`v0.6.2` 下的实际分配：

```
feng3d@0.9.2              @feng3d/math@0.8.6        @feng3d/reactivity@1.0.15
@feng3d/webgpu@0.6.2      @feng3d/path@0.6.2        @feng3d/addons@0.6.2
feng3d-editor@0.7.2       eslint-plugin-feng3d@0.6.2 …
```

### 3.3 发布顺序

按包间依赖做拓扑排序，被依赖者先发（`@feng3d/polyfill` → `@feng3d/math` → `feng3d` → `@feng3d/addons`…），保证下游包发布时上游已可用。

包间存在循环依赖（`feng3d` ↔ `@feng3d/terrain`、`feng3d` ↔ `@feng3d/particlesystem`），检测到环时打印警告并打破约束——registry 按名称解析依赖，环不阻塞发布顺序，只是无法满足全部先后关系。

### 3.4 发布任务做了什么

`scripts/release-packages.mjs` 对每个待发布包依次执行：

1. `npm run clean`（若存在）——先把上一轮产物清掉。像 editor 这种 `outDir` 与 `publicDir` 同为 `public/` 的包，不清理会让带哈希的历史产物一直堆积并被打进 tarball。
2. `npm run build`（若存在）。
3. 写 `package.json`：抬版本号，并把入口指向**实际存在的**构建产物。
4. `npm pack` + 内容校验（见 §4）。
5. `npm publish --access public`。
6. 还原 `package.json`（在 `finally` 里，失败也会还原）。

任一步失败即中止后续包，避免留下「发了一半」的状态。

发布结束后会把 JSON 报告写到 runner 临时目录（`--json /tmp/release-report.json`），供下一步生成 Release 正文。报告含每个包的版本与版本来源说明，见 §3.6。

### 3.5 需要配置的 secret

| Secret | 用途 | 必需 |
|---|---|---|
| `NPM_TOKEN` | npm Automation token（绕过 2FA），需覆盖 `@feng3d` 与 `feng3d` 两个 scope | **是**（缺失时工作流在凭证校验步骤直接失败并给出提示） |

**凭证校验放在 `verify` job**（推 tag 或手动非预演时执行），而不是 `publish`：token 失效时若等到 `publish` 才发现，前面已经白跑完 eslint + 全量单测 + 19 包构建与打包校验（约 10 分钟）。这一点是在实际踩过之后才调整的——第一次发布就因为 token 失效白跑了一整轮。

### 3.6 GitHub Release 的正文

推 tag 发布成功后会自动创建 GitHub Release，正文由
[`scripts/release-utils/release-notes.mjs`](../scripts/release-utils/release-notes.mjs) 生成，内容分两段：

**第一段：版本台账。** 用 `--bump-all` 时各包版本号互不相同（`feng3d@0.9.1`、`@feng3d/math@0.8.5`、`@feng3d/webgpu@0.6.1`…），而 tag 只有一个。只看 Release 标题没人知道这批到底发了哪些版本，所以逐个列出：

```
| 包 | 版本 | 版本来源 |
|---|---|---|
| `@feng3d/math` | `0.8.5` | 0.8.4 已被占用，递进到 0.8.5 |
| `@feng3d/webgpu` | `0.6.1` | 本地版本 0.1.0 落后，抬到目标版本 0.6.1 |
```

首次发布的包会被标出，末尾附一行可整批复制的 `npm i <19 个包@版本>`。

**第二段：自动变更说明。** `gh release create --notes-file` 与 `--generate-notes` 互斥，所以自动说明由脚本调
`POST /repos/{owner}/{repo}/releases/generate-notes` 取回后拼在台账之后（PR 归类、贡献者）。取不到时标注「（未能生成自动变更说明）」而不是静默省略；该接口失败不影响发布流程。

生成器只输出 markdown，不碰网络之外的东西，单元测试见 `test/ReleaseNotes.spec.ts`。

配置位置：仓库 Settings → Secrets and variables → Actions。

`GITHUB_TOKEN` 由 Actions 自动提供，用于最后创建 GitHub Release（`--generate-notes` 自动生成变更说明）；同名 Release 已存在时跳过。

---

## 4. 打包内容校验

发布前会校验 tarball 对使用者确实可用，任一不通过即失败：

1. tarball 非空、含 `package.json`；
2. 发布时 `package.json` 指向的每个入口文件（`main` / `module` / `types`）都真的在 tarball 里；
3. 入口所在目录被 `files` 字段覆盖；
4. 含 `src/` 目录（本仓库采用**源码发布策略**：入口指向 `./src/index.ts`，下游按源码引用，见 AGENTS.md 第 14 章）。

### 4.1 已修的真实缺陷：`eslint-plugin-feng3d` 发布后不可用

`packages/eslint-plugin-feng3d` 的 tsconfig 是 `noEmit: false` + `outDir: "dist"`（19 个包里唯一真正产生产物、入口指向 `dist/` 的包），但它的 `files` 字段是 `["src", "lib"]`——**没有 `dist`**。

后果：发布出去的包里根本没有 `dist/index.js`，而 `main` / `exports.import` 都指向它，安装方一 `import` 就报模块不存在。这个包能发布成功，却完全不可用。

已修：`files` 改为 `["src", "dist"]`，并在发布脚本里加上第 3 条校验，防止同类问题再次溜过去。

---

## 5. 编辑器（`feng3d-editor`）的发包

编辑器与前 18 个库包形态不同：它是 **Web 应用**（Vue 3 + Vite 多页面入口 `index.html` / `run.html`），不是可 `import` 的库。

### 5.1 修正过的发布字段

| 字段 | 修正前 | 修正后 | 原因 |
|---|---|---|---|
| `files` | `dist`, `libs`, `src`, `packages`, `index.js`, `run.js`… | `bin`, `public`, `src`, `projects`, `resource`, `favicon.ico`, `index.html`, `run.html` | vite 产物在 `public/`，原 `files` 里没有它，发布的是空壳；`libs` / `index.js` / `run.js` 在仓库里并不存在 |
| `main` / `module` / `types` | `main.js`(已发布) / `lib/index.es.js` / `dist/index.d.ts` | 移除 | 这三个路径在仓库里都不存在，且编辑器不应被当作库导入 |
| `bin` | 无 | `feng3d-editor` → `./bin/serve.mjs` | 从 npm 安装后没有 dev server，需要能直接跑起来 |
| `clean` | `rimraf "{lib,dist}"` | `rimraf lib dist public` | 清理真实存在产物目录 |
| `start` | 无 | `node ./bin/serve.mjs` | 与 `bin` 一致 |

### 5.2 使用方式

```bash
npx feng3d-editor                 # 默认 http://127.0.0.1:3000
npx feng3d-editor --port 8080 --open
```

[`packages/editor/bin/serve.mjs`](../packages/editor/bin/serve.mjs) 是零依赖静态服务器（只用 Node 内置模块），服务 `public/`：

- 目录请求补 `index.html`；未命中的路径回落到 `index.html`（前端路由友好）
- 路径越界防护：请求逃出根目录时按越界处理，**不返回根目录外的文件**
- 只接受 `GET` / `HEAD`

---

## 6. 已知缺口（未纳入 CI，需要单独处理）

| 缺口 | 现状 | 影响 |
|---|---|---|
| 示例工作区类型错误 | `feng3d-reactivity-examples`、`webgpu-examples` 的 `tsc` 失败（见 §1.2） | `npm run types:workspaces` 在根上跑不通；CI 绕过而非修复 |
| 库源码类型错误（被 editor 深检暴露） | `feng3d` / `polyfill` 源码在 vue-tsc 下报错（`View.ts` canvas 断言、`StandardMaterial.ts` / `TextureMaterial.ts` 的 `TextureField` 收窄、`ClassUtils.ts` 未使用 `@ts-expect-error`），见 §2.2 | editor 的类型检查只能是非阻塞；库自身 `tsc` 因关闭 `strictNullChecks` 等而看不到 |
| 源码发布策略的下游要求 | 发布包入口指向 `./src/index.ts`，`exports` 只有 `import` / `types`，无 `require` | 下游必须是能编译 `node_modules` 里 TS 源码的打包器（如 Vite）；纯 Node / 老 webpack 用不了 |
| 编辑器包体积 | tarball 781 个文件（含 `src`、`projects`、`resource`） | 安装体积偏大；如需精简可收窄 `files` |
| 各包版本号历史混乱 | `feng3d` 发过日期式版本号（如 `201810.3.0`），且本地版本普遍落后于 npm（本地 0.6.0 vs npm latest 0.9.0） | 版本号无法用来推断新旧；发布与打包校验都以 npm `latest` 标签为锚点（见 §3.2.1） |
| e2e 未纳入 CI | `playwright.config.ts` 与 `e2e/` 存在，但 CI 只跑单元测试 | 视觉回归 / 端到端行为没有门禁 |
| `EFFECT_INVENTORY.md` 一致性校验 | ARCHITECTURE_V2 §3 的 R5 规划了 CI 校验 | 清单可能腐化 |

---

## 7. 本地怎么跑同一套检查

```bash
npm ci

# 与 CI 质量门禁等价
npm run ci

# 单独跑
npm run lint:ci          # eslint，零警告
npm run test:run         # 全量单元测试
npm run types:packages   # 19 个包类型检查
npm run build:packages   # 19 个包构建校验

# 发布预演（安全，不发布）
npm run release:dry-run -- --force

# 只预演某几个包
node scripts/release-packages.mjs --dry-run --force --tag v0.6.1 --include feng3d --include feng3d-editor
```

`scripts/release-packages.mjs` 的完整参数：

| 参数 | 说明 |
|---|---|
| `--dry-run` | 只构建 + 打包校验，不发布 |
| `--tag <tag>` | 目标版本来源（默认取根 `package.json` 的 version） |
| `--since <ref>` | 只处理自该 git ref 以来有改动的包 |
| `--include <包名>` / `--exclude <包名>` | 选择/排除包，支持目录名或 npm 包名，可重复 |
| `--no-build` | 跳过各包 `build` 脚本 |
| `--force` | 即使 registry 上已有同版本也走打包校验（仅限配合 `--dry-run`） |
| `--bump-all` | 保证每个候选包都发出版本：落后的抬到目标版本，已占用的沿该包版本序列递进 patch，**绝不降级**（见 §3.2.1） |
| `--allow-downgrade` | 允许发布低于 npm `latest` 的版本（默认拒绝，避免 `latest` 标签回退） |
| `--json <文件>` | 输出 JSON 结果报告 |
