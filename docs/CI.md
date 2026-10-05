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
| `packages/*/test/**/*.spec.ts` | 其余 19 个子包的测试 |
| `test/**/*.spec.ts` | 仓库级脚本的测试（发布版本决策 `release-version.mjs`、Release 正文生成 `release-notes.mjs`、R2 判据层 `r2ModuleScope.spec.ts` 等） |

**当前基线：258 个测试文件 / 2936 个测试用例全部通过**（本机实测，vitest 5.0.2；补测试后请同步本行与 §2.1）。
本行原先记的是「234 / 2709」、§2.1 第 12 步记的是「252 / 2843」——**两处长期互不一致**（每次都只同步一处），
issue #652 落地时（新增 `test/r2ModuleScope.spec.ts` 的 46 条用例）按实测把两处一起对齐。

这批测试同时产出覆盖率并校验阈值（issue #74），见 §1.3。

### 1.1 shortcut 与 terrain 曾经被排除

这两个子包原先写在 `vitest.config.ts` 的 `exclude` 里，理由是「依赖浏览器 / WebGPU 全局」。后果是**它们从未在 CI 里跑过**——测试文件在，但门禁看不到。

现在由 [`vitest.setup.ts`](../vitest.setup.ts) 补齐所需全局，两者纳入全量：

| 缺失全局 | 用途（issue #624 后的现状） |
|---|---|
| `self` + `addEventListener` / `removeEventListener` / `dispatchEvent` | `@feng3d/shortcut` 的 `windowEventProxy` 在**首次 `on()`** 时惰性解析出 `self` 并注册监听（#624 前是模块顶层 `new EventProxy(self)`、`on()` 随即注册，那时缺 `self` 会 `import` 即崩） |
| `MouseEvent` / `KeyboardEvent` / `WheelEvent` | shortcut 用 `instanceof` 区分输入类型（`KeyState.pressKey`、`EventProxy.onMouseKey`） |
| `GPUBufferUsage` 等 WebGPU 常量表 | `@feng3d/webgpu` 在**运行期**读（`WGPUBuffer.defaultGPUBufferUsage` getter、`WGPUTexture._getGPUTextureUsageFlags` 等；#624 前有 class static field 在 import 期读，已改 getter） |
| `GPUTexture` / `GPUBuffer` 类 | `@feng3d/webgpu` 的 `GPUTexture.prototype.createView` 原型补丁由**显式安装函数**装上（#624 前是模块顶层 IIFE），运行期路径仍要用到这两个类 |
| `ImageData` | `ImageUtil` 构造时 `new ImageData(...)`；#624 前 terrain 的默认高度图在模块加载期构造（已改惰性），运行期纹理构造仍要用 |

两点约定：

- **`self` 用真实事件派发而不是 no-op**。no-op 会让「监听器注册了却从不触发」这类缺陷表现为通过。
- **不要定义 `window`**。部分模块用 `typeof window === 'undefined'` 作为「非浏览器环境」守卫（见 `packages/addons/test/browser-stub.ts` 的注释），定义 `window` 会让守卫失效并走进浏览器专属分支。

`packages/feng3d/src/test/webgpu-stub.ts` 仍保留独立副本，因为它被 12 个 spec 直接 `import`，单包内单独跑测试时也要成立。两处都用 `typeof === 'undefined'` 守卫，先到先得，不会互相覆盖。

### 1.2 类型检查为什么不用 `--workspaces`

根 `package.json` 的 `workspaces` 除 22 个包外还包含示例工作区（`examples`、`packages/<包>/examples`），其中 `feng3d-reactivity-examples` 与 `webgpu-examples` 有**既有类型错误**：

- `reactivity/src/arrayInstrumentations.ts` 用了 `toReversed` / `toSorted`，示例的 `lib` 未含 es2023
- `webgpu/src/utils/*` 用了 `WeakRef`，示例的 `lib` 未含 es2021
- `webgpu/examples/src/webgpu/skinnedMesh/glbUtils.ts` 里 `string` 未收窄为 `GPUIndexFormat` / `GPUVertexFormat`

所以 CI 走 `types:packages` / `build:packages`（由 `scripts/run-in-packages.mjs` 只跑 `packages/<包>` 一层）。示例的类型收敛是独立事项，见 §6。

### 1.3 覆盖率门禁（issue #74）

`AGENTS.md` §13 早就写了「覆盖率建议 >80%」，但在此之前 `vitest.config.ts` 没有任何 coverage 配置——**建议没有执行者，等于没有**。现在由 `npm run test:coverage`（= `vitest run --coverage` **加** `node scripts/check-coverage-inflation.mjs`，后者见 §2.1）在跑完同一批测试后校验阈值，低一档就失败。

**阈值是「防止下降」的底线，不是「已达标」的宣告**：

> ⚠️ **阈值要随覆盖率的实质增长跟上**，不是只在换 vitest 时才重测。补齐某个包的测试之后，实测基线会抬升；此时若不调阈值，门禁的「防下降」作用就被削弱了（阈值会慢慢变成摆设）。
> 上一次上调见 issue #356：四项基线从 36.44/31.64/36.24/36.87 涨到 39.96/36.02/40.61/40.35，阈值同步从 35/30/35/35 提到 38/34/38/38。

> ✅ **本轮（issue #134）已按实测把那笔欠账还上**：旧阈值 `38/34/38/38` 曾落后实测 **12～18 个百分点**——覆盖率**掉 12 个点**门禁都不会红，「防下降」**当时等于失效**（正是上面那条警告说的「阈值变成摆设」）。
> 清理批（PR #576）留下了建议值 `54/44/51/54`，本批**没有照抄**：按「本项目估数不可靠」的教训**逐项复测了三遍**（同一份代码、同一台机器），实测与建议值吻合，才按「实测基线向下留余量」的口径定为 **`54/44/51/54`**。

| 指标 | 阈值 | 实测基线（2026-10-05 本机复测，vitest 5.0.2 / Node 22，782 个受统计文件） | 余量 |
|---|---|---|---|
| 语句 | 52 | 54.78%（21178/38657） | 2.78 |
| 分支 | 42 | 45.54%（7808/17144） | 3.54 |
| 函数 | 45 | 48.51%（3663/7550） | 3.51 |
| 行 | 52 | 55.05%（18892/34317） | 3.05 |

> ✅ **issue #667 本批修掉了读数的「整份虚高」，阈值与新基线同步重定**（2026-10-05）。
> 根因是**内置 v8 provider 跨 worker 合并 V8 coverage 时丢函数条目**——`@bcoe/v8-coverage` 的
> `mergeScriptCovs` 用「函数根 range」当函数身份，而 V8 对未执行函数报的根 range 会与别的函数雷同，
> 于是 `count = 0` 的条目被丢弃，剩下的模块顶层 range（count = 模块加载次数）把整份文件算成已执行。
> 修法是 `vitest.config.ts` 改用本仓自定义 provider
> （`scripts/vitest-v8-coverage-provider.mjs`，只把合并 key 换成「函数名 + 根 range」）。机制、最小复现
> 与方案选型见 §2.1。
>
> **改动前后（本机、同一口径对照；改动前读数取自本批开发基点 `19d6065f0`）**：语句 **56.40 → 54.69**、
> 分支 **45.67 → 44.56**、函数 **54.15 → 51.56**、行 **56.45 → 54.65**——下降全部来自「虚高消失」，不是覆盖率退步。
> 13 个虚高基线文件里 **8 个**落回真实值（如 `PointGeometry.ts` 64/64 → 1/64、
> `WGPURenderPassColorAttachment.ts` 74/74 → 3/74）；`webgpu` 包从 40.1 落到 **25.9**。
> 阈值按新基线向下留约 2.5 个百分点重定为 **52 / 42 / 49 / 52**。
>
> ⚠️ **函数阈值已按闭包形态重定：49 → 45**（2026-10-05 第二批完成时）。#674 的「Logic 改工厂闭包对象形态」
> 让函数总数从 5696 一路涨到 6373（每个工厂的 getter / 显式委托 + 每个基座的组合函数都是新函数），
> 已覆盖 3143 → 3029，比例从 53.50 落到 47.52——**分母涨、分子几乎不动**，属形态变化带来的结构性下降，
> 不是用例退步。按「阈值取实测基线向下留余量」重定为 **45**（余量 2.52）；其余三项维持 52 / 42 / 52。
> 本表现已由 `coverage-by-package.mjs --check` 守住（见下），余量再漂就会被报出来。

> ⚠️ **本批（issue #645）复测发现这张表原先的读数已经漂了**（原记 55.96 / 46.05 / 53.23 / 56.17）：
> 语句与行几乎没动（55.96 → 55.96、56.17 → 55.98），但**分支 −0.66（46.05 → 45.39）、函数 +0.60（53.23 → 53.83）**
> ——这是后续批次改了被测代码 / 补了用例造成的，不是同一份代码的抖动（同一环境**连跑两次**的跑动 ≤0.01，
> 见下表；历史四次跑动也 ≤0.02）。
> 影响：**分支这一项的余量原先被高估了 0.66**（文档记 2.05、实际 1.39），其余三项变化不大。
> 已按本机实测更新；取证环境：`origin/master` 的 `69309811b`，整轮 `vitest run --coverage` **两次**
> （249 个测试文件 / 2825 个用例全过、678 个受统计文件，两次读数见上表），余量按**两次中较差的一次**算。
>
> ✅ **这一行现在有门禁校验了**（issue #667 收尾）：`scripts/coverage-by-package.mjs --check` 已把本表纳入比对
> ——实测基线用与分包行覆盖率相同的 `TOLERANCE`（0.5 个百分点），**阈值列与 `vitest.config.ts` 的
> `coverage.thresholds` 精确比对**（防「阈值改了、文档没改」）。
> 解析失败（表头缺失 / 行数不足 4 / 单元格写歪）同样报 problem，**不静默跳过**；
> 解析函数另带合成样例自检，启动时先跑、失败即退出（与 `scripts/r2-module-scope.mjs` 的自检同一做法）。
> 上面那句「漂了 0.65 也没有任何东西报出来」描述的是加门禁**之前**的状态，现已不成立。

> **2026-10-05 的读数为什么整体略高**：issue #134 收尾批（渐变族去 class）把 `gradient.spec.ts` /
> `minMaxGradient.spec.ts` 改写成 `gradientOps.spec.ts` / `minMaxGradientOps.spec.ts`（用例数净增 16），
> 并给 `fieldDiscovery.spec.ts` 补了 2 条纯数据控件类型用例（`objectview` 行覆盖率 66.2 → 75.2）。
> 阈值 `54/44/51/54` **未变**——本次是「实测抬升、余量变大」，按「阈值随实质增长才跟」的口径不动它。

> **余量为什么是约 2 个百分点**：同一环境、同一份代码连跑 4 次，跑动 **≤0.02 个百分点**（语句 55.87～55.89，分支 45.92～45.93，行 56.08～56.10，函数恒为 53.13）；但**跨环境更大**——CI 与本机之间、以及 CI 的 `push` run 与 `pull_request` run 之间，历史实测出现过 **±0.1～0.2** 的抖动（`path` 一行还有已登记的平台差异：本地 90.9 / CI 90.2，见本节表下的说明）。
> 阈值贴着实测线就会**随机红**；它的作用是「防下降」而不是「申报达标」，所以**宁可略低也不要卡在实测线上**。（`ci.yml` 里那句「向下 1 个百分点」是更早一版的注释，本轮口径是约 2 个百分点；`.github/workflows/` 本轮未改，以本节为准。）

> **CI 侧也复测了**（`push` run 只含本分支，`pull_request` run 是本分支 + 最新 master 的合并结果，**真正的合入门槛**）：push run 语句 55.89 / 分支 45.93 / 函数 53.13 / 行 56.09；两次 pull_request run 分别是 55.86 / 45.90 / 53.09 / 56.06 与 **55.85 / 45.89 / 53.09 / 56.06**。
> CI 侧的跨度是 **0.04 个百分点**，方向是 PR run 略低；本机与 CI 之间同样在 0.02～0.04 量级。**按已知最差实测**（55.85 / 45.89 / 53.09 / 56.06）算，新阈值的余量是 **1.85 / 1.89 / 2.09 / 2.06**——仍然留得住，三个 run 的阈值校验都通过。

> ⚠️ **升级测试基础设施（vitest / coverage provider）后必须按新口径重测阈值，不能沿用旧值。**
> 实证：vitest 3.2.6 → 5.0.2 时，同一份代码、同一套 include，
> 语句总数从 **56571 → 30142**、分支分母从 **4366 → 12996**、行总数从 56571 → 27049——
> v8 provider 换了插桩与 sourcemap 映射方式。沿用旧阈值的结果是门禁立刻全红（并非覆盖率真的掉了）。
> 这也是阈值写成「实测基线向下留余量」而不是「固定 60%」的原因：它本来就要随工具口径重测。
> **本轮只调阈值、没有升级基础设施**，这条警告继续有效。

两条配置上的取舍：

- **`include: packages/*/src/**/*.ts`**：没被任何测试触及的文件也进分母（否则「零测试的文件」根本不出现，覆盖率数字虚高）。vitest 5 已移除旧的 `all` 选项，这一职责由 `include` 承担——实测 643 个受统计文件里包含零测试的 `packages/error-logger`。
- **只排除 `*.spec.ts` 与 `*.d.ts`，不按包排除**：editor、particlesystem、error-logger 这些低分项留在分母里（当前值见下表，**不要在这里写死数字**——它们会变，写了就会过时），避免用「排除掉难测的包」把数字做上去。

各包覆盖率现状（**本表由脚本生成，请勿手工编辑**）：

```bash
npm run test:coverage && node scripts/coverage-by-package.mjs   # 打印本表
node scripts/coverage-by-package.mjs --check                    # 与本节比对（分包行 + 文件数 + 全局阈值表），不一致则失败
#   ↑ 这条已在 CI 里跑（紧跟 `npm run test:coverage` 之后，复用它的 json 产出）
```

| 包 | 行 | 文件 | 语句 | 分支 | 函数 |
|---|---|---|---|---|---|
| `watcher` | 97.6 | 2/2 | 96.7 | 83.3 | 100.0 |
| `editor-plugin-rotate` | 96.0 | 4/5 | 96.2 | 100.0 | 90.9 |
| `eslint-plugin-feng3d` | 95.2 | 6/6 | 92.8 | 74.5 | 100.0 |
| `reactivity` | 95.1 | 17/18 | 95.1 | 89.6 | 93.6 |
| `path` | 90.2 | 2/2 | 90.2 | 86.3 | 78.8 |
| `addons` | 90.0 | 21/22 | 87.0 | 74.9 | 70.7 |
| `event` | 85.5 | 5/8 | 85.5 | 77.2 | 85.0 |
| `serialization` | 85.3 | 2/2 | 83.9 | 75.5 | 90.8 |
| `math` | 83.2 | 55/63 | 83.2 | 75.1 | 90.7 |
| `error-logger` | 81.5 | 1/1 | 80.6 | 63.4 | 53.8 |
| `ui` | 78.3 | 14/15 | 77.4 | 60.6 | 78.8 |
| `objectview` | 75.2 | 2/3 | 75.2 | 70.2 | 66.7 |
| `cannon-plugin` | 78.7 | 8/8 | 78.9 | 73.9 | 45.2 |
| `shortcut` | 68.8 | 8/8 | 69.4 | 51.2 | 78.0 |
| `feng3d` | 65.8 | 100/115 | 65.8 | 55.0 | 60.6 |
| `polyfill` | 62.4 | 7/9 | 63.5 | 67.5 | 58.3 |
| `tsl` | 59.5 | 45/85 | 56.3 | 50.3 | 50.7 |
| `terrain` | 48.4 | 2/6 | 47.2 | 24.1 | 39.5 |
| `particlesystem` | 39.0 | 38/49 | 41.7 | 29.5 | 22.8 |
| `filesystem` | 34.8 | 10/14 | 37.0 | 42.6 | 36.3 |
| `assets` | 47.3 | 19/20 | 48.0 | 28.9 | 27.9 |
| `webgpu` | 26.0 | 58/132 | 26.6 | 19.5 | 33.5 |
| `editor` | 16.9 | 76/189 | 17.2 | 14.7 | 15.9 |

> **2026-10-05（#709 收编 `@feng3d/tsl` 批）本机实测**：`packages/tsl` 作为第 **22** 个包进入分母
> ——82 个 `src/.ts`、320 个用例（`packages/tsl/test`，随根 `vitest run` 一起跑），
> 首次读数 **行 52.8（39/82 文件有覆盖）**，落在 30%~60% 档。
> 本批 rebase 到含 #674 的最新 master 后重测：全局 **54.07 / 44.88 / 52.21 / 54.42**，
> 阈值 `54/44/51/54` **未变**（余量 2.07 / 2.88 / 3.21 / 2.42；函数总数 5874 → **6875**，其中 tsl 贡献 823 个）。
> tsl 的加入让全局读数小幅下降：分母 +82 个文件，其中 **43 个当前零覆盖**（`glsl/` 的各内置函数与
> `types/` 的类型包装层没有被单测直接触及；收编批只做「原样迁移 + 门禁对齐」，不新增用例，见 issue #709）。
> 受统计文件 **683 → 765**。

> **2026-10-05（蒙皮第二批 #337）本机实测**：已 rebase 到最新 master（含 #674 批 1 的 Geometry 工厂化、
> #652 的门禁脚本退出码回归用例），新增测试文件
> `packages/feng3d/src/animators/skeleton/skinningVertexLayout.spec.ts`（顶点缓冲布局离线验收），
> 全量 **258 个测试文件 / 2936 个用例**。`webgpu` 行 **40.1 → 42.5**：新用例首次打通
> `WGPUVertexBufferLayout` 的顶点布局路径（此前该路径只在真 GPU 渲染时走到，单测覆盖不到）；
> `feng3d` 行 **67.2 → 68.0**（#674 批 1 工厂化后由本批新用例托回）。全局四项
> **56.47 / 45.73 / 53.97 / 56.55**，阈值 `54/44/51/54` **未变**（余量 2.47 / 1.73 / 2.97 / 2.55）。

> **2026-10-05（`@feng3d/ui` 四批新架构迁移批）本机实测**：全局 **57.51 / 47.15 / 54.98 / 57.69**（语句/分支/函数/行），
> 其中 `ui` 自己的行覆盖率 **77.3（12/14 文件）**——四批迁移把 `packages/ui/src` 全部迁到「纯数据接口 + Logic」的同时
> 补齐了用例（本轮 +62 例）。阈值 `54/44/51/54` **未变**：本次是「实测抬升」，余量 3.51 / 3.15 / 3.98 / 3.69，
> 按上面「阈值随实质增长才跟」的口径留到下次统一上调。

> **2026-10-05（UI 接线收尾批）本机实测**：全局 **56.1 / 45.6 / 54.0 / 56.1**（语句/分支/函数/行），
> 阈值 `54/44/51/54` **仍未变**（余量 2.1 / 1.6 / 3.0 / 2.1）。本批新增 14 例（`feng3d` 的
> `ComponentType.spec.ts` 7 例 + `ui` 的 `uiWireup.spec.ts` 7 例），`ui` 行覆盖升到 **77.6**、
> `feng3d` 升到 **67.5**（`serialization` / `polyfill` / `editor` 的读数随本轮全量重跑同步）。
> 读数已 **rebase 到最新 master**（含 `caches/*` 30 处 `ChainMap` lazy-init 那批——它揭穿了 webgpu
> 的覆盖率虚高，见上一条），故全局语句比本批单独跑时低约 1.5 个点：那是那批的已知影响，不是本批的回退。
> 余量已压到 1.6～3.0，**下次有实质增长时应一并上调阈值**。

> **2026-10-05（UI 独立渲染 Pass 批）本机实测**：全局 **54.06 / 45.2 / 47.89 / 54.3**（语句/分支/函数/行），
> 阈值 `52/42/45/52` **未变**。本批把 UI 改成**独立渲染 Pass**
> （`packages/ui/src/core/UIPass.ts`：布局驱动 + 树序收集），`UIMaterial` 换成真正的 UI 材质与
> WGSL 着色器，组件类型登记表加了 `renderPass` 维度（主场景渲染列表跳过非 `forward` 的组件）。
> `ui` 行覆盖 **76.4 → 77.7**（文件 12/14 → **13/15**，新增 `UIPass.ts` 与 `test/uiPass.spec.ts`）；
> 受统计文件 **771**。读数已 rebase 到含 #674 闭包形态与 #711 TSL 材质批的最新 master。

> **2026-10-05（UI 世界空间批）本机实测**：全局 **54.44 / 45.42 / 48.08 / 54.7**（语句/分支/函数/行），
> 阈值 `52/42/45/52` **未变**。本批补上 `UIRenderMode.WorldSpace`（此前只有字段声明、没有消费点）：
> `UIUniforms.u_projection` + `uiMaterialWGSL` 的 `cameraUniforms` 分支、`CanvasLogic.layout` 在世界空间
> 不复位宿主变换、`ForwardRenderer.prepareExtraRenderObjects` 同时注入相机 uniform。
> `ui` 行覆盖 **77.7 → 78.3**（文件 13/15 → **14/15**，新增 `test/worldSpace.spec.ts`）；
> 受统计文件 **779**（含新收编的 `cannon-plugin`）。

> **`webgpu` 行为什么从 60.6 变成 59.9**（2026-10-05，R2 空参缓存 lazy-init）：该包 4 个缓存容器从
> 「类 `static` 字段初始化」改成「`static get` + 首次访问创建」——改前那 4 行在模块加载时必然执行、必被覆盖；
> 改后要调用 getter 才算覆盖，而 `WGPUPipelineLayout` 的 getter 只走真 GPU 路径（单测没有轻量入口），
> 未覆盖行因此 +2。本行取**CI 实测值**（本机与 CI 同为 59.9；改动前 CI 实测 60.4）。
> 同批改动的 `event` / `reactivity` 两个包的行覆盖率没有越出 ±0.5 容差（新增的 getter 行被新用例覆盖住了）。

> **`webgpu` 行为什么从 60.0 变成 40.1**（2026-10-05，`caches/*` 的 **30 处 `ChainMap` 缓存 lazy-init**）：
> 这 20 个百分点**不是**「getter 要调用才计覆盖」那类小账（本批 30 处 getter 只值 ~60 行），而是
> **新用例把一批"覆盖率虚高"的文件拉进了真实统计**。
>
> 实测经过（本机，2026-10-05）：
> 1. 在 `WGPUTexture` 构造函数里打点（写文件），跑全量单元测试 ⇒ **命中 0 次**——即
>    `packages/webgpu/src/caches/*` 里那 29 个文件（30 处 `ChainMap` 缓存）**此前没有任何测试真正执行过**；
> 2. 同一份 lazy 化代码、**不放**新增用例 `test/r2LazyChainMaps.spec.ts` ⇒ 这些文件仍被报成
>    `119/119`、`61/61`、`28/28`（**满覆盖**）、`webgpu` 包行覆盖率 60.5；
> 3. 放回该用例（它直接 `import` 这 30 个类并断言懒分配语义）⇒ 这些文件落到 `17/118`、`23/61`、`11/28`
>    （**函数级真实数据**），`webgpu` 包行覆盖率 40 上下（40.1，取 rebase 到最新 master 后的实测）。
>
> 也就是说：**只有真正执行过的代码才算覆盖**这条常识，在这批文件上此前是不成立的——它们被其它模块
> 间接 `import`，于是被整份算成已覆盖（**虚高**）。新增用例把它们变成"被加载且被部分执行"，
> 虚高的 100% 随之消失，露出 `~17%` 的真身。
>
> ⚠️ **机制归因已在 issue #645 修正**：上面原先写的是"v8 provider 按**模块顶层块范围**把它们整份算成已覆盖"，
> 该归因**不准确**。两条独立最小复现（`%TEMP%` 下，未写入仓库）证明：① `NODE_V8_COVERAGE` 的原始数据是
> **准确的**——只被 `import`、自身不执行的 ESM 模块里，`constructor` / 计算属性 / 未被调用的函数如实报告
> `count=0`，函数块没有被外层吞掉；② `ast-v8-to-istanbul` 的 `convert()` **也是准确的**（转换后
> `constructor` / `compute` / `dispose` 正确落在未覆盖）。所以失真在 **vitest v8 provider 的
> TS / vite transform / sourcemap / istanbul 收集映射链**上，触发条件是「该模块被加载、但这一轮里没有
> 任何代码真正执行」——同一轮里两种形态并存也印证这点（同属 `caches/`、同样被间接 `import` 的
> `WGPUBindGroupLayout.ts` 报 `1/10`，而 `WGPUTexture.ts` 报 `119/119`）。
>
> ⚠️ **「40.1 是这个包的真实读数」这句话已被 issue #645 推翻**（本行原先就是这么写的）：
> 本批只揭穿了 `caches/*` 那一批，实测仍有 **6 个文件 / 265 条语句**保持 100%
> ——`WGPUCanvasContext`（57 条）、`WGPURenderPassColorAttachment`（74）、`WGPUTimestampQuery`（49）、
> `WGPURenderBundle`（34）、`WGPUCanvasTexture`（27）、`WGPUExternalTexture`（24）。
> 它们的 `fnMap` 里是 `_onConfiguration` / `gpuCanvasContext` 这类必须真 GPU 才能走到的入口，
> 且**躲过了 issue #645 原先"语句计数全等"的判据**（spec 访问 getter 打破了语句计数的全等，
> 但没有打破 100%）。准确的说法因此是：**40.1 已消除大部分虚高，但仍偏高——`webgpu` 的真实行覆盖率
> 低于 40.1**；能确定的只是「不是本批造成的质量退步」（同批 `ChainMap` 化本身对覆盖率几乎无影响：
> 不放新用例时 60.5，与改动前的 60.0 同档）。这 6 个文件现在都登记在 issue #645 方案 C 的基线里
> （见本节下方与 §2.1）。
>
> 连带影响：**本批让全局语句覆盖率下降约 1.6 个点**（本机对照：同一份 lazy 化代码，只把新增用例
> 移走时实测 **57.58**、放回用例后 **55.97**——这 1.6 点全部来自"虚高被揭穿"，与 lazy 化本身无关）。
> 55.97 仍高于阈值 54，余量约 **2.0** 点。
> **门槛该不该跟着降**：本批**不动** `vitest.config.ts` 的 54/44/51/54——这次的变化是"虚高被揭穿"而不是
> 真回退，收紧不了也不该放松；若后续再补 webgpu 的用例把真实覆盖率抬上去，再按实测上调。
> **暴露的 R10 缺口**（独立于本批，见 §2.1）：`coverage.include` 的 `all` 语义下，
> "被间接 `import` 但从未执行"的文件会被算成满覆盖，读数**只能上不能下**；
> 判断某个包真实覆盖率时，不能只看这张表。
>
> ✅ **本批（issue #645 方案 C）已把这个缺口变成可见**：新增
> `scripts/check-coverage-inflation.mjs` + `scripts/coverage-inflation-baseline.json`，
> 随 `npm run test:coverage` 进 CI，**新增虚高文件即失败**（判据、实测与接入点见 §2.1）。
> 当前基线 **13 个文件 / 448 条语句**，按包为 `webgpu` 9、`shortcut` 2、`editor` 1、`feng3d` 1
> ——其中 **6 个 / 265 条语句**正是上面那批"躲过旧判据"的 `webgpu` 文件。
> 方案 A（收紧 `include` 语义）与方案 B（#594 的按包阈值）**本批有意不做**，理由见 §2.1。
>
> ✅ **issue #667 已修掉根因**（2026-10-05）：`vitest.config.ts` 改用本仓自定义 v8 provider
> （`scripts/vitest-v8-coverage-provider.mjs`），把跨 worker 合并的函数身份从「根 range」改成
> 「**函数名 + 根 range**」，8/13 个虚高文件落回真实值，基线收紧到 **5 个文件 / 44 条语句**
> （剩下 5 个经逐条核实是「函数计数被夸大、语句真实执行」的判据边界）。`webgpu` 的真实行覆盖率
> 因此是 **25.9**（不是 40.1、更不是原先声称的 60.x）。

> ⚠️ **在 worktree 里跑覆盖率必须补别名，否则读数会系统性偏低。**
> worktree 的 `node_modules` 常是指向主工作区的 junction，包名导入会被解析到主工作区源码，
> 而 `coverage.include` 是相对本 worktree 的 glob ⇒ 那些覆盖数据被直接丢弃。正确做法：
>
> ```bash
> npm run test:coverage -- --config vitest.worktree.config.ts   # 仓库根已提供该配置
> ```
>
> 少了它，实测 `feng3d` 会假跌到 **57.1%（68/108 文件）**、`webgpu` 60.1% → 7.1%、全局行 54.2% → 52.8%（issue #492）。
> **注意该配置里必须同时写 `feng3d`（不带 scope 的包名）与 `@feng3d/<pkg>` 两条别名** —— 只写后者时
> `import ... from 'feng3d'` 仍会解析到主工作区，`packages/feng3d/src/index.ts` 会显示 0/111 覆盖。
>
> 补全别名后，本地与 CI 只差 **`path` 一行**（本地 90.9 / CI 90.2）—— 那是**真实的平台差异**
> （路径分隔符相关的分支），**不要按本地读数改这一行**。该行已登记在 `scripts/coverage-by-package.mjs`
> 的 `PLATFORM_DIFFS` 里：本地跑 `--check` 跳过它的**行覆盖率**比对（并打印一行 `ℹ` 提示，不静默），
> CI 上照常比对。**文件数列不享受这条豁免**（它与平台无关），本地、CI 都逐包精确比对。
>
> **`feng3d` 在 CI 上有 run-to-run 摆动，故该包单独放宽了比对容差**（2026-10-05，`@feng3d/ui` 四批迁移批）：
> **同一个 commit 的两次 CI run 分别给出 66.4 与 67.1**（run `37256357717` = 66.4、run `37256948216` = 67.1；
> 两者被测代码完全相同，只差两个文档/脚本文件），本机连续多轮稳定 **67.1**，两次 run 都是
> 246 个测试文件 / 2805 个用例全过、分母完全相同（92/108 文件）。也就是说**CI 上这个包在 66.4 ~ 67.1 之间摆（0.7），
> 本机读的是上限**——不是文档腐化，也不是本机/CI 的平台分支差异。该摆动疑似来自 `@feng3d/ui` 的测试所触达的
> 那批 feng3d 文件里的**时序敏感路径**（帧驱动 / effect 调度：只跑 `packages/feng3d/src` 的测试时 feng3d 是
> 57.6% / 70 文件，ui 的测试把它抬到 67.1% / 92 文件），**未逐行定位**。
>
> 处置：表中这一行写**本机实测值 67.1**（与 `node scripts/coverage-by-package.mjs` 的输出一致），并在
> `scripts/coverage-by-package.mjs` 的 `PACKAGE_TOLERANCES` 里把 `feng3d` 的容差放宽到 **0.8**
> （覆盖 0.7 的摆动 + 0.1 的常规抖动）——这样 CI 摆到 66.4 或 67.1 都判绿。**摆动消除后应收回该行。**
> 取证障碍已记录在 issue #642：**CI 不上传覆盖率产物**，本机无法复现/定位 CI 侧的差异行。

往 80% 走的路径（对应已开的 issue）：补 serialization（#103，已完成）、替换占位测试（#104：objectview / terrain / particlesystem / webgpu）、渲染核心补单测（#105：render / materials / shaders / cameras / light）。**上调阈值时同步改本表与本文件 §1 的基线行**——阈值与现状脱节会让门禁变成噪声。

---

## 2. CI 工作流（`.github/workflows/ci.yml`）

触发：推送到任意分支、PR、手动触发。tag 推送交给 release 工作流，避免同一提交跑两遍。

> **排查：同一 commit 为什么可能一红一绿（先看这条再怀疑自己）**
>
> `push` run 与 `pull_request` run 的**基准不同**：`push` run 只含本分支；`pull_request` run 在「本分支 + 最新 master」的合并结果上跑。
> 因此**同一个 commit 可能一个绿一个红**——master 上他人新增文件改变了计数/覆盖率（例如 §1.3 的分包覆盖率表、
> `scripts/bundle-size-baseline.json`），而 master 未同步这些文档时尤甚。
> 判断「是不是自己引入的」**必须以 `pull_request` run 或本地 rebase 到最新 master 后的实测为准**：
> 不要拿 `push` run 的绿论证「与我无关」，也不要拿它的红否定本分支的改动。

### 2.1 质量门禁 job

下表按 [`ci.yml`](../.github/workflows/ci.yml) 的**实际步骤顺序**列出 `quality` job 的门禁（`npm ci` 等准备步骤不列），
「规范」列是它服务的 [AGENTS.md](../AGENTS.md) §15 规范编号。

> **R1–R13 的状态、缺口与执行者以 [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) §3.1 现状表为唯一权威**
> （[AGENTS.md](../AGENTS.md) §15 是它的速查副本）。本节只登记「在 quality job 的哪一步跑、跑什么命令、拦什么」，
> 判断与 §3.1 冲突时**以 §3.1 为准**——三处不各写一份互不相同的清单，是本节的写入约定。

| # | 步骤 | 命令 | 规范 | 拦什么 |
|---|---|---|---|---|
| 1 | 代码检查（eslint，零警告） | `npm run lint:ci` | R2 / R4 / R5（自研规则）+ §11.6 只读形状 + R13 纯函数层 | `prelint:ci` 钩子先跑「构建 `eslint-plugin-feng3d`（`dist/` 不在版本控制里）→ `check-math-no-class.mjs` → `check-readonly-array-fields.mjs`（只读数组字段，issue #605）→ `check-pure-modules.mjs`（纯函数层，R13）→ `check-register-logic-factory.mjs`（registerLogic 只接受工厂函数，issue #653）→ `gates:host`（20 条宿主门禁，见 §2.2）」，再跑 eslint（覆盖 `packages/` + `scripts/` + `test/`，`--max-warnings 0`；`packages/editor` 走自己的配置，见 §2.2） |
| 2 | 文档相对链接 | `node scripts/check-docs-links.mjs` | ——（文档，非 R 编号） | 仓库内相对链接失效即失败（外链与页内锚点不查） |
| 3 | effect 盘点 | `node scripts/check-effect-inventory.mjs` | R5 | `EFFECT_INVENTORY.md` 与实际 `effect(` 调用点**按文件比对数量**，脱节即失败 |
| 4 | 模块级副作用 | `node scripts/check-module-side-effects.mjs --strict` | R2 | **AST 判据**（issue #614；与第 16 步共用 `scripts/r2-module-scope.mjs`）——模块顶层 / 类 **`static` 字段与 `static` 块** / **模块级调用回调**（含**顶层 IIFE**、多行声明、对象字面量、缩进的顶层块）里的：① 缓存创建（空参 / 只有泛型实参的 `new Map/WeakMap/Set/WeakSet()`，外加**项目自有**的 `new ChainMap()`——`ChainMap` 是 webgpu 的链式字典、不套空参限制）；② 启动型调用（定时器 / rAF / ticker 启动）；③ `globalThis` 写入。**新增即失败**（已实测的存量按 `scripts/toplevel-new-baseline.json` 冻结放行）；应用入口按 `ENTRY_FILES` 清单**整类**豁免 |
| 5 | tree-shaking 产物校验 | `node scripts/check-tree-shaking.mjs` | R2（产物级） | 真打一次包，断言未引用的重量级模块不在产物里，并用「显式引入」的对照产物自证判据有效 |
| 6 | 文档现状标签 | `node scripts/check-doc-status-labels.mjs` | R11 | `FRAMEWORK_DESIGN.md` 每个 `##` 章节必须有 `> 现状：✅/🔶/⬜（证据）` 标签 |
| 7 | 分层依赖 | `node scripts/check-layer-deps.mjs` | R1 | 最底层包（`math` / `reactivity`）的 `@feng3d/*` 依赖白名单 + 无环 |
| 8 | 示例 lint | `npm run lint:examples` | ——（示例纪律，issue #77） | `examples/src/**/*.ts` 零警告；`prelint:examples` 钩子先跑 `check-examples-imports.mjs`（示例入口可解析，见下） |
| 9 | strictNullChecks 独立配置 | `node scripts/check-strict-dirs.mjs` | R6 | `feng3d` / `editor` 走 `tsconfig.strict.json`，本包 `src` 的类型错误必须为 0 |
| 10 | strictNullChecks 包级清单 | `node scripts/check-strict-packages.mjs` | R6 | `scripts/strict-packages.json` 双向校验：漏登记与误关闭都失败 |
| 11 | 依赖方向 | `node scripts/check-layer-direction.mjs` | R1 | 按包级依赖检查分层，存量向上依赖冻结在基线、新增即失败 |
| 12 | 单元测试 + 覆盖率门禁 + **覆盖率虚高自检** | `npm run test:coverage` | R10 | 全量 **258 个测试文件 / 2936 个测试用例**（与 §1 同步，issue #652 按实测对齐），校验四项覆盖率不低于阈值（见 §1.3），**随后**跑 `scripts/check-coverage-inflation.mjs` 拦「被间接 `import` 却从未执行、却被整份算成 100%」的文件（issue #645，新增即失败，见下） |
| 13 | 分包覆盖率与 §1.3 一致 | `node scripts/coverage-by-package.mjs --check` | R10 | 复用上一步的覆盖率产出与 §1.3 那张表比对，防它悄悄过时（issue #369） |
| 14 | 类型检查 | `npm run types:packages` | R6 | **21 个包**的 `tsc`（各包 tsconfig 为 `noEmit`，故等价类型检查）——`feng3d-editor` 没有 `types` 脚本（它是 `vue-tsc` 的 `type-check`），其类型门禁在 §2.2 的 `check-editor-types.mjs` |
| 15 | 构建校验 | `npm run build:packages` | —— | **22 个包**的 `build`（确保 `build` 脚本可用；编辑器走 `vite build`） |
| 16 | 模块级 `new` 存量门禁 | `node scripts/check-toplevel-new.mjs` | R2 | **AST 判据**（issue #614，与第 4 步共用同一份判据实现）下 import 时执行的**全部**模块级 `new`（`export const x = new X()` 声明形式、`new Set([...])` 只读常量集合、库代码单例、类 `static` 字段、顶层 IIFE 里的构造）按「文件::构造器」冻结在 `scripts/toplevel-new-baseline.json`（现 **94** 个组合；#614 的空参缓存欠账已清 7 个键、#624 批次清掉 terrain 的 1 个键、ChainMap 批再清掉 29 个键，见下），**新增即失败**、减少只提示。应用入口按 `ENTRY_FILES` 清单豁免、**不计入基线**，见下 |
| 17 | 纯数据声明式 | `node scripts/check-imperative-construction.mjs` | R3 | 对「纯数据类」名单（`gen-objectview-schema.mjs` 的产物）使用 `new`；基线已归零、新增即失败 |
| 18 | math 数值 / 几何类型禁 class | `node scripts/check-math-no-class.mjs` | ——（issue #134 阶段 C 收尾） | 19 个目标类型不得再是 class，基线已为空。（同一条命令也挂在 `prelint:ci` 上，所以本步是本次运行里的第二次执行） |
| 19 | 包体基线与 byte 天花板 | `node scripts/check-bundle-size.mjs` | R9 | 3 档引用面 × raw/gzip 与 `scripts/bundle-size-baseline.json` 比对，超出容忍（+2%）即失败——判据是**改代码**，不是跑一次 `--update` |
| 20 | 发布产物预演 | `npm run release:dry-run -- --force --no-build` | —— | 构建 + `npm pack` + **内容校验**，不发布（`--no-build` 复用第 15 步产物） |
| 21 | 工作区污染检查 | `git status --porcelain` | —— | 构建若改动了受版本控制的文件则失败 |
| 22 | registerLogic 工厂形态 | `node scripts/check-register-logic-factory.mjs` | ——（issue #653 收尾） | AST 判第二实参：带 `as` 断言、或同文件内声明的 class 裸标识符即失败（要求 `XxxLogic.create` / 函数名 / 箭头函数）。类型层已挡住各包 `src`，本脚本补 `test/` 与 `examples/` 等类型检查覆盖不到的地方（同一条命令也挂在 `prelint:ci` 上，所以本步是本次运行里的第二次执行） |

**R1–R13 各自对应上面哪一步**（状态 ✅/🔶/❌ 与缺口以 §3.1 为准，此处不重复判断）：

| 规范 | 步骤 | 执行者 |
|---|---|---|
| R1 依赖方向只向下 | 7、11 | `check-layer-deps.mjs`、`check-layer-direction.mjs` |
| R2 零模块级副作用 | 1、4、5、16（编辑器侧另见 §2.2） | 规则 `feng3d/no-module-side-effect`（随 lint）、`check-module-side-effects.mjs --strict`、`check-tree-shaking.mjs`、`check-toplevel-new.mjs`、`check-editor-module-effects.mjs`；前两条 CI 脚本共用 AST 判据层 `scripts/r2-module-scope.mjs` |
| R3 纯数据声明式 | 17 | `check-imperative-construction.mjs`（基线归零、0 处存量） |
| R4 响应式纪律 | 1 | 4 条自研规则（随 lint）；**仍是真缺口**：不识别 `toReactive` / `logic()` 产生的代理，`this.effect(` 不受检 |
| R5 effect 必须注解 | 1、3 | 规则 `feng3d/effect-annotation` + `check-effect-inventory.mjs` |
| R6 可空性显式 | 9、10、14 | `check-strict-dirs.mjs`、`check-strict-packages.mjs`、`types:packages` |
| R7 作用域守卫异常安全 | —— | **无执行者**：`batchRun` / `noMutationCount` 机制已有 `try/finally` 与 API 级回归，但 11 个生产调用点没有逐个异常用例 |
| R8 视觉回归强度 | —— | **未进 CI**：容差在 `playwright.config.ts`（全局 0.01）、`e2e/examples.config.ts`（26 处放宽）与 `playwright.webgpu-examples.config.ts`（0.02，5 个 webgpu 示例，issue #712 补）里，examples 视觉回归不在任一 workflow；`editor-e2e` 跑的是编辑器产物、不校验容差 |
| R9 包体天花板 | 19 | `check-bundle-size.mjs` + `scripts/bundle-size-baseline.json` |
| R10 覆盖率门禁 | 12、13 | `npm run test:coverage`（四项阈值 + `check-coverage-inflation.mjs` 虚高自检）+ `coverage-by-package.mjs --check`（§1.3 表一致性） |
| R11 文档现状标签 | 6 | `check-doc-status-labels.mjs` |
| R12 提交规范 | —— | **有意不设机器门禁**（约定式提交 + PR 评审；提交信息语义无法机器判定） |
| R13 纯函数层 | 1（`prelint:ci` 钩子） | `check-pure-modules.mjs` + `scripts/pure-modules.json`；规范口径见 [CODE_TAXONOMY.md](./CODE_TAXONOMY.md) |

**两条 R2 脚本的分工与重叠**（issue #606 明确，别再有"我以为你管了"的夹缝）：第 4 步只认**缓存形态**
（内置的 `Map/WeakMap/Set/WeakSet` + 项目自有的 `ChainMap`，外加启动型调用 / `globalThis` 写入），
第 16 步兜**其余模块级 `new`**；`new Map()` 这类会**同时**出现在两处报告里，
重叠是**有意**的（去重比漏网好）。**两条的判据现在是同一份实现**（`scripts/r2-module-scope.mjs`，issue #614 抽出）——
原先各写一套的「行级正则 + 行首无空白」已删掉：口径分叉本身就是 #606 / #614 反复出问题的地方。
**存量基线与入口豁免也统一了**：两条读同一份 `scripts/toplevel-new-baseline.json`；
入口定义是 `scripts/r2-module-scope.mjs` 里的 **`ENTRY_FILES` 显式清单**（issue #614：原先只有第 4 步有一条
`ENTRY_FILE` 正则、第 16 步完全没有入口概念，于是示例入口的 `new GUI(...)` 键**默默**进了基线；
现在加/减入口只改这一个地方，两条脚本的读数不可能再分叉）。

**入口清单里是哪三个文件、为什么**（`ENTRY_FILES` 逐条写着理由）：

| 入口文件 | 为什么它可以在 import 时执行代码 |
|---|---|
| `packages/reactivity/examples/index.ts` | 示例集合的**导航页**：模块级构建重定向表（`const validRedirects = new Map()`） |
| `packages/webgpu/examples/index.ts` | 示例集合的**导航页**：同上 |
| `packages/editor/src/vue-app/main.ts` | 编辑器**应用挂载入口**：挂载 Vue 应用、安装 objectview 组件与内置插件 |

清单**刻意不含**单个示例页（`packages/webgpu/examples/src/webgpu/` 各页面的 `index.ts` 等 20 余个文件）：
它们模块级的 `new GUI(...)` / `new Stats(...)` / `new Float32Array(...)`（实测 25 个键）**继续按存量冻结在基线里**。
理由是取向而非偷懒——两条门禁一贯"宁可多报"（#606："去重比漏网好"），而示例页正是 `new AudioContext()`
那类 import 期副作用最容易出现的地方；把它们也豁免掉，等于一次放行 28 个键。
要放宽只需往 `ENTRY_FILES` 加条目（基线会相应减少），但那是**一次需要说明理由的收紧/放宽动作**，
不该由"扫一遍 html 自动推断"悄悄决定。
门禁对清单做**反向校验**：登记项必须存在，过期条目会让脚本失败（漏登记则朝安全侧倒——新入口不豁免、门禁报错）。

**R2 的两处存量单例为什么仍冻结在基线里**（本次复核，不是"忘了改"）：

| 位置 | 形态 | 引用面（本次实测） | 处置 |
|---|---|---|---|
| `packages/event/src/GlobalEmitter.ts` | `export const globalEmitter = new EventEmitter<MixinsGlobalEvents>()` | `globalEmitter` **77 处 / 20 文件**（其中 editor 69 处），并经 `feng3d` 公开入口 `export *` 出去 | 保持冻结，见下 |
| `packages/shortcut/src/WindowEventProxy.ts` | `export const windowEventProxy = new EventProxy<WindowEventMap>(() => …self…)`（**目标已惰性解析**，模块顶层不再读 `self`，见下） | `windowEventProxy` **121 处 / 23 文件**（editor 49、`feng3d/src` 35） | 保持冻结，见下 |

三点理由：

1. **它们不是缓存，是"身份敏感"的对象单例**。`EventEmitter` 的构造会把自己写进三个 `static` 注册表
   （`targetEmitterMap` / `emitterTargetMap` / `emitterListenerMap`），事件路由靠 `instanceof` 与对象身份；
   改成 `getGlobalEmitter()` 这类 getter 函数是**公开 API 变更**（`feng3d` / `@feng3d/event` / `@feng3d/shortcut` 三个包），
   要动约 198 处调用点、编辑器 `resource/template/libs/feng3d.d.ts`（用户脚本用的 API 快照），
   以及按源码文本断言 `globalEmitter.on(` 的 `packages/editor/test/selectionSync.spec.ts`。
2. **只改这两处并不能让模块变成 R2 干净**：`EventEmitter` 的构造会把实例写进三张注册表
   （`targetEmitterMap` / `emitterTargetMap` / `emitterListenerMap`；#614 欠账批已把这三张表**本身**
   改成 lazy-init，见下节），而 `new EventEmitter()` / `new EventProxy(self)` 这个**构造调用**仍然留在
   `GlobalEmitter.ts` / `WindowEventProxy.ts` 的模块顶层——import 期的注册写入还在原地。
   只把 `export const` 改成 `getXxx()` 只是把门禁的键"挪走"，属于**看起来修好了**。
3. 正确修法是设计改动而不是判据补丁：注册表 lazy 化 + getter API + 一个 deprecation 窗口
   （先加 `getGlobalEmitter()` / `getWindowEventProxy()`，`feng3d` 内与 editor 的调用点迁完、发大版本时再删旧导出）。
   `WindowEventProxy` 那条顶层 `self` 还额外让 `@feng3d/shortcut` 在非浏览器环境 **import 即 `ReferenceError`**
   （Node 里 `typeof self === 'undefined'`，那时靠 `vitest.setup.ts` 补全局才跑得起来）——**这一条已在 issue #624 批次修掉**：
   不动 getter API，只把「目标的取得」惰性化（`EventProxy` 接受一个目标解析函数，首次 `on()` / 读 `target` 时才解析），
   `import '@feng3d/shortcut'` 与 `import 'feng3d'` 在 Node v22.23.2 下实测均已不再崩。
   这不改变上表「模块级单例保持冻结」的结论——`new EventProxy(...)` 本身仍是模块级 `new`，只是不再读宿主全局。

门禁在这种情况下**如何认可它**：第 16 步是**存量冻结**策略——基线里的「文件::构造器」视为已知存量放行，
新增即失败、减少只提示。所以这两处**不是白名单豁免**，而是**登记在册的欠账**
（`scripts/toplevel-new-baseline.json`）：清理掉一处就该跑一次 `--update` 收紧，基线**只允许减少**。

**R2 判据已从行级换成 AST（issue #614），覆盖四类盲区；仍有四条明确边界（集中在 §2.1.1）。**

换之前判据是「**行首无空白 = 模块顶层**」+ 单行正则。`scripts/probe-r2-blindspots.mjs`（只读探针，**刻意不进 CI**）
在 `packages/` 下实测：AST 判定「import 时真的会执行」的 `new` 共 **158 处 / 137 个「文件::构造器」键**，
两条行级脚本只能看见 **96 处**（登记的键 90 个）——**漏 62 处**；换算到键，AST 的 137 个键里有 **47 个**
不在原基线里（原基线 90 个键**全部**仍是模块级，没有"行级假阳性"需要顺手收紧）。
处数与键数两个口径不同，差在"同一行里有两个 `new`"这类情况：行级正则一行只取第一个
（`filesystem/examples/src/index.ts` 的 `new ReadFS(new HttpFS(""))` 只登记了 `ReadFS`，
`new HttpFS` 那处"行级看得见、键却没登记"）。
漏的全是缩进造成的：类 `static` 字段 / `static` 块（**42 处**，如 `webgpu/src/caches/*` 的 30 处
`private static map = new ChainMap()`；#614 欠账批清掉 9 处空参缓存后为 **33 处 / 31 键**，
本批（ChainMap）再清掉 30 处 / 29 键后为 **3 处 / 2 键**）、**顶层 IIFE**、**多行声明**（`const x =\n    new Map();`）、
模块级**块 / 对象字面量 / 回调**里的缩进行（`Entity.ts` 对象字面量里的 6 处 `new Set([...])`、
`createTexture.ts` 模块级 `if` 块里的 7 处 `new ImageUtil`）。
现在这四类都在判据内，两条脚本共用一份实现 `scripts/r2-module-scope.mjs`（先例：`scripts/check-editor-module-effects.mjs`）。
**基线因此从 90 个键变成 135 个**（+47 个新登记的键、−2 个入口键）；#614 欠账批清理空参缓存后收紧到 **128**，
rebase 到最新 master 后为 **125**；master 上的 #624 批再清掉 terrain 的 1 个键（125 → **124**）；
本批（ChainMap）`--update` 收紧到 **95**（见下节）。

> **数字校正（#614 欠账批实测）**：上一批文档、提交信息与脚本注释里记的是
> 「159 处 / 138 键 / 行级 97 处 / 旧基线 91 个键 / 新基线 136 个键」，整体**偏大 1**；
> 本批在 `202dbfe47`（#614 判据 AST 化的落地提交）上复算，实测是
> **158 处 / 137 键 / 行级 96 处 / 旧基线 90 → 新基线 135**（"漏 62 处"两端一致，是对的）。
> 已在 `scripts/probe-r2-blindspots.mjs` 头注释、`docs/ARCHITECTURE_V2.md` §3.1 与 `AGENTS.md` 同步为实测口径。
>
> **上一批读数（本机实测，2026-10-05，ChainMap 批 rebase 到**当时**的 master 之后）**：全库 `new` **1400 处** /
> import 期 **115 处（97 键）** / 行级可见 **92 处** / 漏 **23 处** / 基线 **95 键**。
> 上一批记录的是「import 期 146 处（127 键）/ 基线 125」，差额 **−31 处 / −30 键**里
> **−30 处 / −29 键**来自本批的 `webgpu/src/caches/*`（`WGPUBindGroup.ts` 一个文件有两处 `new ChainMap()`，
> 故处数 30、键数 29），剩下 −1 处 / −1 键是 master 上 #624 批清掉的 terrain 键。
> 更早那批 editor/math/polyfill 清理带来的差异（删文件、迁 MathUtil）已包含在上述 146/127 里。
>
> **再复测（issue #652 落地时，同一台机器、同一份脚本）**：全库 `new` **1423 处** /
> import 期 **117 处（96 键）** / 行级可见 **94 处** / 漏 **24 处** / 基线 **94 键**。
> 与上一行的差额（全库 +23、import 期 +2 处 / −1 键、行级可见 +2 处、漏 +1 处、基线 −1 键）
> 来自 master 随后合入的批次（新增 / 删除的模块级 `new`），**不是判据变了**：
> 基线那 −1 键是 `4a0689051`（#278 阶段 4a「资源系统装配显式化」）清掉的
> `packages/editor/src/assets/EditorRS.ts::ReadWriteFS`。两条**独立实现**（门禁脚本与
> `probe-r2-blindspots.mjs`）在"import 期处数"上给出的都是 **117 处**，互相对得上——
> 这正是探针存在的意义（它证明门禁的 AST 层没写错）。

R2 判据的**四条边界**（入口豁免的代价、基线粒度、`module-call-callback` 的保守性、规则层与脚本层的
覆盖差异）集中写在 §2.1.1「已知局限」里，此处不再复述——本节的写入约定是"同一件事不写两份"，
而这份边界清单此前正是被三处注释以「§2.1「已知局限」」的名字引用、却没有对应小节的悬空引用
（issue #652 实测）。


**#614 的空参缓存欠账（本批结清）**

AST 判据一次性暴露出 **12 处**"空参缓存"（本该被第 4 步"新增即失败"拦下，此前一直被行级判据漏掉）。
逐处判定后：**9 处 / 7 个键已 lazy-init**、**2 处 / 1 个键按理由保留**、**1 处确认为假阳性后保留登记**；
基线 **135 → 128**（键减少 7 个，由 `node scripts/check-toplevel-new.mjs --update` 收紧）。
PR 合并前 rebase 到最新 master（a61f05454）时，基线再降到 **125**——另有 3 个键是 master 上其它批次
随文件删除/迁移清理掉的（`editor/src/ScriptCompiler.ts::ScriptCompiler`、`editor/src/assets/NativeFS.ts::NativeFS`、
`polyfill/src/MathUtil.ts::MathUtil`），**不是本批的空参缓存**。

| 位置（基线键） | 处数 | 处置 | 判定理由 / 为什么等价 |
|---|---|---|---|
| `packages/event/src/EventEmitter.ts::Map` | 3 | ✅ lazy-init | 三张注册表都是 `private static`、仅本类内使用 → 换成 `static get` 后**调用点零改动**，不是公开 API 变更；分配时机从 import 推迟到首次访问 |
| `packages/reactivity/src/effect.ts::WeakSet` | 1 | ✅ lazy-init | 暂停标记集合，仅本类内 `add` / `has` / `delete`；首次 `trigger()` 走进暂停分支时才分配 |
| `packages/reactivity/src/property.ts::WeakMap` | 1 | ✅ lazy-init | 目标 → 依赖表缓存，仅本文件用；**保持原有可见性**（模块级 `property()` 函数也要访问它），只把字段换成 `static get` |
| `packages/webgpu/src/caches/WGPUMultisampleState.ts::Map` | 1 | ✅ lazy-init | 实例缓存，`private static`，访问点只有构造器与 `getInstance` |
| `packages/webgpu/src/caches/WGPUStencilFaceState.ts::Map` | 1 | ✅ lazy-init | 同上；该字段原先对外可见，但全仓无外部访问点，`readonly` 语义不变 |
| `packages/webgpu/src/caches/WGPUPipelineLayout.ts::Map` | 1 | ✅ lazy-init | 管线布局描述符缓存，`private static`，只在 `getPipelineLayout` / `getGPUPipelineLayout` 内读写 |
| `packages/webgpu/src/data/Buffer.ts::WeakMap` | 1 | ✅ lazy-init | 缓冲区配置缓存，`private static`，只在 `getBuffer` 内读写 |
| `packages/assets/src/AssetData.ts::Map` | 2 | ⛔ 保留 | **公开 `static` 字段**（用户脚本 API 快照 `packages/editor/resource/template/libs/feng3d.d.ts` 里就是 `static assetMap: Map<any, string>` / `static idAssetMap`）且是**资源登记表**而不是按需缓存；lazy 化必须把它变成 getter，属公开 API 形态变更 → 留在基线，留给专门批次 |
| `packages/webgpu/test_web/index.ts::Set` | 1 | ⛔ 保留（假阳性） | 回调里的局部变量，import 期不执行；理由与处置见 §2.1.1 边界 3 |

7 个已改键的**共同等价性**：改动只把「缓存容器的分配时机」从 **import 期**推迟到**首次访问**，
容器种类、键类型、全部读写点、以及 `destroyCall` 里的清理点都没动；首次访问多一次 `null` 检查，
之后每次访问与改动前完全一致（命中同一个 `Map` / `WeakMap` / `WeakSet` 实例）。
行为回归由新增的 `test/r2LazyCaches.spec.ts` 守（4 个用例：断言私有存储**调用前为 `null`、调用后非 `null`**、
同一输入两次调用拿回同一实例、监听表照常参与事件路由），读写路径另由
`packages/{event,reactivity,webgpu}` 的既有用例覆盖。

**#614 的 `ChainMap` 欠账（ChainMap 批结清）**

同一次 AST 判据化还暴露出另一类此前**两条门禁都看不见**的模块级分配：`packages/webgpu/src/caches/*` 里的
**30 处 `static map = new ChainMap<...>()`**。`ChainMap` 是项目自有的链式字典、**不是** `Map` / `WeakMap` /
`Set` / `WeakSet`，所以既不在 R2 自研规则的候选名单里、也不在 `check-module-side-effects.mjs` 的"缓存创建"
判据里，只被 `check-toplevel-new.mjs` 的基线冻着（键名是「文件::`ChainMap`」）。
逐处判定后 **30 处全部 lazy-init**（同一种机械改法：`private static _map: ChainMap<...> | null = null`
+ `static get map()` 首次访问创建），基线 **125 →（#624 的 terrain 键）124 → 95**
（处数 30、键数 29——`WGPUBindGroup.ts` 一个文件里有两处），随后 master 上 `4a0689051`
（#278 阶段 4a）又清掉 1 个键（`editor/src/assets/EditorRS.ts::ReadWriteFS`）→ 现为 **94 键**。

> **现状：候选名单已补上 `ChainMap`（本批）**。上面那段是**清欠账当时**的情形；存量清到 0 之后，
> 本批把 `ChainMap` 补进了两处候选名单——
> `scripts/check-module-side-effects.mjs` 的 **`PROJECT_CACHE_NAMES`**（与内置的 `CACHE_NAMES` 分开登记，
> **不套空参限制**：`ChainMap` 未声明 `constructor`、也不存在 `new Set([...])` 那种"只读常量表"用法，
> 所以任何实参形态都判为缓存创建）与自研规则的 **`CACHE_CONSTRUCTORS`**
> （**现在**是 `Map/WeakMap/Set/WeakSet/ChainMap`——`WeakSet` 是 issue #652 补进去的，
> 那次补 `ChainMap` 时规则层只加到了 `Map/WeakMap/Set/ChainMap`，漏了脚本层早就有的 `WeakSet`；
> 两侧现在集合相等且由 §2.1.2 的断言守着）。
> 从那以后新增 `static map = new ChainMap()` / 模块顶层 `new ChainMap()` 会**直接失败**。
> 本批实测：`packages/` 下非 spec 的 `.ts` 里模块级 `new ChainMap()` **0 处**（30 处都在 getter 函数体内，
> 另 5 处在 `.spec.ts` 里、不在扫描范围），基线仍为 **94 键**——**扩名单不产生任何基线变动**。
> **误报面**：判据按构造器**短名**匹配、不看导入来源（与 `check-imperative-construction.mjs` 同一局限），
> 但全仓只有 `packages/webgpu/src/utils/ChainMap.ts` 一处定义，唯一用途就是 `caches/*` 的身份键缓存，
> **没有非缓存语义的用例**，因此**不设任何豁免**。

| 范围 | 处数 | 可见性 | 处置 | 判定理由 / 为什么等价 |
|---|---|---|---|---|
| `packages/webgpu/src/caches/*`（29 个文件） | 30 | 23 处 `private static` / 7 处对外可见（`static readonly`） | ✅ lazy-init | 全部是 `getInstance()` / `getGPU*()` 的**按需缓存**，键含 `GPUDevice` 或数据侧对象、实例在 `destroyCall` 里 `delete` 回同一张表；`private` 的换成 `static get` 后**调用点零改动**；7 处对外可见的经 `git grep` 实测**全仓无任何外部访问点**（只有类内 `map.get/set/delete`），与上一批 `WGPUStencilFaceState` 同判据，`readonly` 语义不变 |

**为什么 30 处都能改（等价性论证）**：

- 只改**分配时机**（import 期 → 首次访问）；容器种类（`ChainMap`）、键元组类型、全部读写点都没动；
- **清理路径**：每个类的 `destroyCall(() => { Xxx.map.delete(key); ... })` 走的是 `Xxx.map` getter，
  而构造器里已经 `Xxx.map.set(key, this)` 走过同一个 getter ⇒ 拿到的是**同一个容器实例**，
  `delete` 落在同一张表上；实例从未创建过时其 `destroyCall` 也不会注册，不产生"提前建表"的新分支。
  `test/r2LazyChainMaps.spec.ts` 用例 ④ 专守这条（`destroy()` 后 `map.get(key)` 变 `undefined`、再取是新实例）；
- `ChainMap` 以 `WeakMap` 为底，除 `size` 外无全局状态，lazy 化不影响弱引用语义；
- **不动的部分**：`WGPUBindGroup.gpuBindGroupMap`（GPU 侧绑定组缓存，只增不减）与其余 29 处改法完全一致。

行为回归：新增 `test/r2LazyChainMaps.spec.ts`（4 个用例）——① 30 处私有存储在 import 期都为 `null`；
② 首次访问才建容器且两次访问同一实例；③ 用最小假 device 走 20 个真实入口
（`getInstance` / `getGPUBindGroupLayout` / `getGPUShaderModule` 等），断言同一输入两次调用同一实例、
不同 device 各建一份；④ `destroy()` 后清理路径仍作用在同一容器上。
（`vitest.setup.ts` 不模拟 WebGPU 设备，但这些类的 GPU 调用都在 `computed(...)` 里、是惰性的，
假 device 足够；确需着色器反射的 `WGPUPipelineLayout.getGPUPipelineLayout` 只在 ①② 里覆盖。）

> ⚠️ **别名：本批把 `webgpu` 覆盖率读数从 60.0 打到 40.1** —— 原因与处置见 §1.3 表下方的专门说明
> （**不是** lazy 化本身的开销，而是新用例把一批"被间接 `import` 却从未执行"的文件从**虚高的 100%**
> 拉回真实值），并暴露了 R10 的一条已知缺口。

**R10（覆盖率门禁）的已知缺口（ChainMap 批暴露，独立于 R2）——已由 issue #645 方案 C 接住**

`coverage.include: packages/*/src/**/*.ts` 让"没被任何测试触及的文件"也进分母，但实测发现：
**"被其它模块间接 `import` 过、自身一行都没执行"的文件会被算成满覆盖**。
证据（本机 2026-10-05）：`webgpu/src/caches/*` 那 29 个文件在 `WGPUTexture` 构造器里打点，跑全量单元测试
命中 **0 次**，却被报成 `119/119`、`61/61`、`28/28`（满覆盖）。
后果是这张表**只能上不能下**：一旦有人为这些文件补一个 `import` 它们的用例，读数会"跌"一大截
（60.0 → 40.1），看着像质量退步、其实是虚高消失。

**根因与最终修法**（issue #645 证据 2 + issue #667 定案）：失真不在 v8 的 range 语义
（`NODE_V8_COVERAGE` 原始数据准确），也不在 `ast-v8-to-istanbul` 的 AST 收集（其 `convert()` 准确），
而在 **vitest v8 provider 的 TS / sourcemap 收集映射链**的**具体一步**：**跨 worker 合并 V8 coverage 时丢函数条目**。
`@bcoe/v8-coverage` 的 `mergeScriptCovs` 用「函数根 range」（`ranges[0]` 的 `startOffset;endOffset`）当函数身份，
而 V8 对未执行（未编译 / 已被 flush）的函数只报 function-level coverage，其根 range 会与**别的函数**雷同
（实测 `PointGeometry.ts` 的 `<static_initializer>` 与 `<instance_members_initializer>` 同为 `[889, 4440]`）；
`mergeScriptCovs` 遇到「同根 range 已有 block-level 条目 + 新条目是 function-level」时**直接丢弃**后者，
于是 `count = 0` 的函数消失，剩下的模块顶层 range（count = 模块加载次数）把整份文件算成已执行。
触发条件是「同一模块出现在 **≥2 份** worker 覆盖率数据里」——真实项目必然如此；单跑一个测试文件时
`mergeScriptCovs` 走单元素快路径、不触发合并，读数反而是对的（这正是 issue #645 一度误判
「V8 原始数据准确」的原因）。**最小复现**（issue #667）：两个都 `import '../packages/feng3d/src/index'`
的测试文件，`PointGeometry.ts` 由真实的 `1.56%`（1/64）变成虚高的 `100%`。

✅ **修法（落地物）**：`vitest.config.ts` 把 `coverage.provider` 从 `'v8'` 改成 `'custom'` +
`customProviderModule: './scripts/vitest-v8-coverage-provider.mjs'`——该 provider 继承内置
`V8CoverageProvider`，只把 `mergeScriptCovs` 的分组 key 从「根 range」换成「**函数名 + 根 range**」，
其余逻辑（`include` 语义、istanbul 映射、阈值）完全一致。所以配置一个正则、或只改 `include` 都修不掉根因；
修好后 8/13 个虚高文件落回真实值，基线从 13 个 / 448 条语句收紧到 5 个 / 44 条语句。

✅ **处置：读数自检已落地成门禁**（issue #645 **方案 C**，2026-10-05）

| 落地物 | 作用 |
|---|---|
| `scripts/vitest-v8-coverage-provider.mjs`（**issue #667**） | **根因修复**：自定义 v8 provider，把跨 worker 合并的函数身份从「根 range」换成「函数名 + 根 range」；`vitest.config.ts` 用 `provider: 'custom'` 接入 |
| `scripts/check-coverage-inflation.mjs` | 扫 `coverage/coverage-final.json` 列出虚高 / 函数计数失真文件；**新增即失败**、修好提示收紧 |
| `scripts/coverage-inflation-baseline.json` | 存量基线（issue #667 后收紧为 **5 个文件 / 44 条语句**）；只登记 `inflated`，纯 enum / 常量模块判为 `real-const` 不登记 |
| `vitest.config.ts` 的 `coverage.reporter` 加 `json` | 判据要逐语句 / 逐函数的命中次数（`json-summary` 只有汇总百分比）；产物 7.2 MB / 678 个文件、序列化 <1 s，见 §1.3 与配置内注释 |
| 根 `package.json`：`"test:coverage": "vitest run --coverage && node scripts/check-coverage-inflation.mjs"` | **接入点**（见下） |

**为什么接入点是 `test:coverage` 之后，而不是 `prelint:ci`**：质量门禁 job 的**第一步**就是 `npm run lint:ci`，
而覆盖率产物要到**第 12 步** `npm run test:coverage` 才产生——挂在 `prelint:ci`（`check-math-no-class.mjs` /
`check-readonly-array-fields.mjs` 的既有位置）上，CI 里它**永远**读不到产物、只能跳过，等于没有门禁
（只有本地"先跑覆盖率再跑 lint"才会偶然生效）。挂到 `test:coverage` 之后，产物就在同一条命令里产生、
CI 第 12 步天然会跑到它，而且**不需要改 `.github/workflows/`**（本仓推送凭据没有 `workflow` scope，
见 `AGENTS.md` §16）。等有 `workflow` scope 时，可把它提成紧跟第 12 步的独立步骤（脚本本身无需改动）。

**判据（比 issue #645 原先的判据更准）**：一个文件的**全部函数计数完全相等**（记为 `N > 0`），
且 `N` 等于该文件"**模块顶层语句**"的计数（= 模块加载次数）。要点：

- **为什么盯函数计数**：失真就是把"模块顶层块执行了 N 次"摊到该模块**每个函数**上，
  于是 `constructor` / `_onCreate` / getter 全被算作执行了 N 次；真执行时不同函数的调用次数几乎必然
  互不相同（实测 `packages/math/src/geom/euler.ts` 是 5/6/7/15/16…）。
- **为什么不用 #645 的"语句计数全等"**：① 它会命中大量纯 enum / 常量模块（实测 32 个里 **27 个**是误报，
  那些文件加载即全执行、100% 是真的）；② 它会**漏掉**语句计数被 getter 访问打破、但函数计数仍被整份夸大的
  文件——正是上面那 6 个 / 265 条语句。
- **"模块顶层语句"不靠猜**：用 istanbul `fnMap[i].loc`（函数体范围）**反选**出不在任何函数体内的语句，
  其计数最大值即加载次数。这一步很关键：若拿"全部语句计数的最大值"当加载次数，会把
  `MinMaxCurveVector3.ts`（`getValue` 真被调用 93 次）、`ParticleSystemShapeHemisphere.ts`（真被调用 300 次）、
  `plugins/index.ts`（真被调用 37 次）这类**真执行**的文件误报进来。
- **自动排除纯 enum / 常量**：源码里没有可执行函数体（无 `class` / `function` / 箭头函数 / getter-setter）
  ⇒ 判 `real-const`，不计入虚高清单（但仍统计打印）。

**实测对比**（2026-10-05，`origin/master` `69309811b`，678 个受统计文件）：

| 判据 | 命中 | 其中纯 enum / 常量（误报） |
|---|---|---|
| issue #645 原判据（语句计数全等 = 函数计数全等） | 32 | 27 |
| **本脚本判据（函数计数全等 = 顶层语句计数）** | **13** | **0** |

13 个 / 448 条语句，按包 `webgpu` 9、`shortcut` 2、`editor` 1、`feng3d` 1；
**含 §1.3 点名的全部 6 个漏网文件**，另多抓到 `Keyboard.ts`、`webgpu/src/data/Texture.ts`、
`webgpu/src/data/Buffer.ts`、`WGPUBindGroupLayout.ts` 等同型文件。**已知残留**（有意不追求 100% 精确，
方案 C 本就是"登记 + 复核"）：① 函数计数**不全等**、只有个别函数被夸大的文件（如 `WGPUTexture.ts` 的
`map` / `_writeTextures`）不命中；② `WindowEventProxy.ts`（2 条语句、1 个箭头函数）属边缘命中。

**方案选型**（issue #667）：选 **方案 D（修映射链）**，A / B 均未选：

- **方案 A（去掉 `coverage.include` 的全量语义）**：**修不掉这个问题**——那 13 个文件是被其它模块
  **间接 `import`** 的，本来就在 V8 数据里，去掉 `include` 只会让「完全没被 import 的零测试文件」退出分母
  （全局语句会从 56.44% 跳到 **69.62%**，issue #645 实测：237 个零覆盖文件 / 6137 条语句退出分母），
  虚高文件照样虚高；还会让"新文件没测试"不再可见（那正是当初加 `include` 要防的事）。
- **方案 B（#594 的按包 / 按文件阈值）**：在虚高读数上设阈值 = **把虚高冻结成"不许下降"的基线**，
  反而掩盖问题；它应当在本条（读数可信）之后独立推进。
- **方案 D（修映射链）**：唯一治本，所以选它（落地物见上）。

另：`scripts/coverage-by-package.mjs` 的"文件"列以 `lines.covered > 0` 判"文件已覆盖"，
此前对虚高文件**必然为真**（实测 `webgpu` 的 `58/132` 里有 9 个是虚高文件）。**issue #667 修掉根因后
这一列已可信**：那些文件现在按真实覆盖参与判断，`webgpu` 的文件数仍是 `58/132`，但原因是
`WGPURenderPassColorAttachment.ts` 这类文件**确实有 3 条顶层语句被执行**，不是虚高。脚本里的
`lines.covered > 0` 逻辑**无需改动**，只更新了注释；函数级失真（含修复后残留的 5 个
「函数计数被夸大、语句真实」文件）仍由 `scripts/check-coverage-inflation.mjs` 独立守住。

**另外修掉了探针自身的一处判据缺陷**（本批实测发现）：探针原先的 `ctxOf` 用
`CallExpression.expression === 函数节点` 认 IIFE，而最常见的写法 `(() => { ... })()`
在 AST 里隔着 `ParenthesizedExpression`——于是**带括号的 IIFE 整类被判成"函数体内"**，
探针自称覆盖的"IIFE 盲区"其实一直**没被覆盖**。本批在 `202dbfe47` 上把两份实现都跑了一遍复算：
修正前 **157 处 / 136 键**（漏网 45 键 / 61 处）、修正后 **158 处 / 137 键**（漏网 46 键 / 62 处），
多出来的那一处正是 `packages/editor/src/bridge/EditorBridge.ts:50-60` 的
`const BRIDGE_CLIENT_ID = (() => {...})()`（IIFE 里 `new URLSearchParams(window.location.search)`，import 时真的读 `location`）。
`scripts/r2-module-scope.mjs` 与探针现在共用同一套"剥括号"逻辑；破坏性实验
（`static` 字段 / 顶层 IIFE / 多行声明 / 对象字面量 / 缩进行里的 `new Map()` 各造一个探针）**五类全部 exit 1**。

**探针怎么用**：`node scripts/probe-r2-blindspots.mjs`（`--all` 打印全部条目）——它只读、不写文件、**不进 CI**，
用途是给判据做**独立复核**：判据改完后，它用另一份实现算出与门禁同一批读数（总数 / 每个键），
两边对得上才说明门禁的 AST 层没写错。
**清欠账时也用它**：每清掉一处空参缓存就复算一次，核对"探针报的空参缓存数"与"门禁的基线键数"是否同步下降
（#614 欠账批：12 处 → 3 处、135 键 → 128 键 → rebase 后 125 键；
ChainMap 批：`new ChainMap()` 30 处 → 0 处、`static-field` 盲区 33 处 → 3 处、基线 125 键 →（#624）124 → **95** 键）。

「发布产物预演」这一步的价值：`npm pack` 与 `npm publish` 走同一套打包逻辑，所以能在 PR 阶段就发现「包里少了入口文件」这类**发布成功但完全不可用**的缺陷（见 §4.1 的真实案例）。

`--force` 让「版本已发布过」的包也走一遍打包校验；该参数被限制为只能配合 `--dry-run` 使用（npm 不允许覆盖已发布版本）。

**「示例入口可解析」拦的是什么**：Vite 6 起，dev 启动会按 `build.rollupOptions.input` 扫描全部示例页入口；
**任一示例 import 了引擎不存在的导出**（典型是引擎重构后遗留的旧 API 示例，如
`import { GameObject, Scene, Camera, Renderable } from 'feng3d'`），整个 dev server 会以
`Failed to scan for dependencies from entries` 失败——**所有示例都打不开**，而现场只有 esbuild 的
`No matching export in ... for import "..."`。`scripts/check-examples-imports.mjs` 用一次 esbuild 打包
把同一批入口解析一遍（`examples/index.html` + `src/**/*.html` 里 `<script src>` 引用的脚本），
不需要浏览器即可拦住。

它**挂在 `npm run lint:examples` 的 `prelint:examples` 钩子上**（根 `package.json`），因此 CI 里
已有的「examples lint」步骤会顺带执行它，无需单独加一步 workflow（对 workflow 文件的改动需要
`workflow` scope 的凭据，这条路径也顺带免掉了那个依赖）。`npm run ci` 里则显式调用同一条命令。

**`examples` 的 vite 配置为什么统一到 `vite.config.ts`**：仓库里曾同时存在 `examples/vite.config.js`
（早期 three.js 风格的构建配置）与 `examples/vite.config.ts`（端口 3000 / `feng3d` 源码 alias /
error-logger 插件）。Vite 的默认配置文件名解析顺序里 `.js` 在 `.ts` 之前，于是 `.ts` 的内容被
整体遮蔽——`npm run dev` 起在 5173、日志插件不生效（`examples/logs/` 不再更新），而
`playwright.config.ts` 的 `webServer.url` 等的是 3000。现在 `dev`/`build`/`preview`
都显式 `--config vite.config.ts`，配置文件只有一个来源。

**workspace 子包一律按源码解析**：`examples/vite.config.ts` 把 `@feng3d/<name>` 解析到
`packages/<name>/src/index.ts`，并用 `optimizeDeps.exclude` 把它们排除出依赖预构建。原因是嵌套的
`packages/<pkg>/node_modules/@feng3d/<name>` 里可能残留历史 npm 安装的**旧 dist 副本**（本仓子包是
源码发布、不构建 dist），它们会遮蔽 workspace 源码，表现为运行时「模块不提供导出 xxx」——
例如 `packages/filesystem/node_modules/@feng3d/polyfill/dist/index.js` 就缺少新版 `__class__` 导出，
会让**所有**示例白屏。

### 2.1.1 已知局限（R2 判据的边界）

> **为什么把这个名字写成正式小节**：`scripts/check-toplevel-new.mjs`、`scripts/probe-r2-blindspots.mjs`
> 与 `docs/ARCHITECTURE_V2.md` §3.1 三处都用「docs/CI.md §2.1「已知局限」」指这段内容，
> 而本文件里此前**没有**这个名字的小节（issue #652 实测）——文字引用不受 `check-docs-links.mjs`
> 保护（它只查仓库内相对链接），标题一改就静默失效。本批把内容集中到这里并给上编号，
> 让那三处引用有落点。

四条边界（都在实测里指得到实例，不是理论）：

1. **应用入口整类豁免**（清单见上表：两个示例导航页 + 编辑器挂载入口），代价是入口页的真副作用一起放行。
   实测一处：`packages/editor/src/vue-app/main.ts:93` 的模块级 `setTimeout(async () => {...}, 0)`（推迟主题初始化）
   ——它在 import 时启动一个宏任务。旧判据同样豁免它（该文件本来就在旧 `ENTRY_FILE` 里），所以本批**没有放松**；
   但换成 AST 判据后这类位置**不会被自动发现**，只能靠 code review。
   **风险边界**：豁免只覆盖清单里的文件，**库代码一律不豁免**——"缓存必须 lazy-init / import 时不要启动 /
   不要写 `globalThis`"这三条对库仍然是硬的。
   **将来若要收紧**（两条都要先改**入口文件本身**，不是改判据）：① 清单只豁免"模块级 `new`"，
   启动型调用与 `globalThis` 写入照旧判——需先把入口页的启动行为改成显式 bootstrap 并被调用；
   ② 取消豁免、把入口页的存量登记进基线。本批不走这两条的理由写在 `ENTRY_FILES` 上方：
   入口页的启动行为本身就是"应用启动"的固有语义，判死后只剩"包一层函数"这种假修法。
   另外清单**刻意不含单个示例页**（25 个 `new GUI(...)` 键继续冻结在基线里），见上面的入口清单小节。
2. **基线的键是「文件::构造器」，不含行号、也不含出现次数**：同一文件里**再加一个同名**构造器
   （如 `EventEmitter` 的第 4 个 `static ... = new Map()`）不会被判失败。想收紧得先把存量清零、再把基线缩到空。
   这一条与第 16 步共享。
3. **`module-call-callback` 是保守判据**：只看"函数表达式被当参数传给某个调用"，不区分那个调用是否**立即**执行回调，
   所以 `document.addEventListener('DOMContentLoaded', () => { const s = new Set(); })` 也会命中
   （实测 `packages/webgpu/test_web/index.ts:423`）。判定做不到精确——`addEventListener` 与 `forEach` 在语法上无区别。
   取向与两条门禁一致：宁可多报。
   **#614 欠账批已核实这一处是假阳性**：`new Set<string>()` 是回调里的**局部变量**（`const allDirPaths = ...`），
   import 期不执行、也不是模块级缓存。处置是**保留在基线里并在此注明**（键 `packages/webgpu/test_web/index.ts::Set`），
   **不改代码**：判据面（"回调是否同步执行"）本来就无法从语法上判定，把它挪出判据只有两条路——
   放松整类保守性，或把该示例页加进 `ENTRY_FILES`（会一次放行该文件的**全部**真副作用，比留一个已在册的键更糟）。
4. **自研规则 `feng3d/no-module-side-effect` 仍不覆盖** 顶层 IIFE 里的 `new Map()` 与类字段初始化器
   （`isModuleScope` 见到 `ClassBody` 或函数节点就放行）——所以第 1 步与第 4/16 步的覆盖**不重合**，
   别拿任一条当作全覆盖。
   **这两条是"能力差集"，`WeakSet` 那条不是**（issue #652 分清）：本批把漏掉的 `WeakSet` 补进了规则层的
   `CACHE_CONSTRUCTORS`，依据是 `f71a074ae` 引入 `WeakSet` 时**只改了脚本层**、提交信息写着
   "判据漏了名字，不是策略有意放过"，而规则层自 `37f68ee41` 建规则起就没动过名单。
   现在规则层 `Map/WeakMap/Set/WeakSet/ChainMap` 与脚本层的 `CACHE_NAMES` + `PROJECT_CACHE_NAMES`
   是**同一集合**，且由机器断言守着（见 §2.1.2）——原先那句「两处名单已同步」只对 `ChainMap` 那批成立、
   `WeakSet` 只在一侧，措辞误导，已随本次修正删掉。

### 2.1.2 门禁自身的回归测试、名单一致性与扫描量自证（issue #652）

R2 的四层判据此前**既无判据单测、也无任何自检**。#652 的破坏性实验证明后果是真的：
把共用判据层 `scripts/r2-module-scope.mjs` 的 `effectiveParent` 打回"不剥括号"（**一处改动**），
两条 R2 门禁**都 exit 0**，`check-toplevel-new.mjs` 还把消失的键读成
「有 1 个存量已被清理，可以跑 `--update` 收紧基线」——**判据 bug 被伪装成存量清理**，
照做会把欠账永久移出门禁视野。本批补三层（**都不动现有判据逻辑**）：

| 层 | 位置 | 守什么 | 覆盖的失效模式 |
|---|---|---|---|
| 判据层单测 | `test/r2ModuleScope.spec.ts` | 4 类模块级上下文的分类、**顶层 IIFE 的剥括号**、入口清单反向校验、基线读取、`collectModuleLevel*` 的收集口径（每个上下文都有正/反例） | 判据形状写错 |
| 脚本内联合成样例自检 | `check-module-side-effects.mjs`（13 条）、`check-toplevel-new.mjs`（12 条） | 合成片段直接喂进判据，"该报的报、不该报的不报"；**启动时先跑、失败即 exit 1**（`--update` 之前就拦下） | 改判据时手滑 / 单点回归 |
| 名单一致性断言 | `check-module-side-effects.mjs` 启动时（`checkCacheNameLists`） | 脚本侧 `CACHE_NAMES` / `PROJECT_CACHE_NAMES` 与规则层 `CACHE_CONSTRUCTORS`、`check-editor-module-effects.mjs` 的 `MUTABLE_MODULE_CACHE` **集合相等**；不一致即 exit 1 并打印两侧差异 | #606 / #647 反复踩的名单漂移 |

**⚠️ 脚本内自检的局限（如实写清，别当万能）**：自检与被测判据**同文件同进程**，判据写错时自检会
**一起错**——它发现不了"两处都错"（判据与自检共享同一个错误理解，例如两边都以为"不剥括号"才对）。
它防的是**单点回归**；判据形状本身靠 `test/r2ModuleScope.spec.ts`（独立文件、独立进程、断言的是行为）。
`scripts/probe-r2-blindspots.mjs` 的 `CACHE_RE` **刻意不在名单比对的范围内**：它要冻结历史读数，
跟着门禁一起改会让"上一批 / 这一批"的读数不可比（理由见该脚本文件头）。

#### 做法 3：扫描量自证（issue #652）

上面三层守的是「判据形状」与「名单漂移」，但它们都**默认判据扫到了东西**。
`scripts/check-*.mjs` 大多是「遍历文件 / 包 / 规则 → 收集命中 → 集合为空即通过」，
扫描根被改名 / 移走时判据本身**不会变红**（集合本来就空），上面三层也照样绿。本批把它变成硬断言：

| 脚本 | 自证的量 | 判据 |
|---|---|---|
| `check-layer-direction.mjs` | `packages/` 下带 `package.json` 的 workspace 包数；`package.json` 解析失败数 | 包数 ≥ 1；解析失败数 = 0（原来 `catch` 后静默 `continue`） |
| `check-module-side-effects.mjs` | `collectTsFiles(packages/)` 扫到的文件数 | ≥ 1 |
| `check-toplevel-new.mjs` | 同上 | ≥ 1 |
| `check-imperative-construction.mjs` | `SCAN_DIRS` 下实际扫到的 `.ts` 文件数；`DATA_TYPE_SCHEMA` 顶层键数 | 两者都 ≥ 1（**命中数为 0 是合法状态**——基线 `entries` 本就为空） |
| `check-math-no-class.mjs` | `packages/math/src` 下的 `.ts` 文件数 | ≥ 1（命中数为 0 是终极目标，不是异常） |
| `check-readonly-array-fields.mjs` | `packages/*/src` 下的 `.ts` 文件数 | ≥ 1（存量 16 处是合法状态） |
| `check-effect-inventory.mjs`（第二批） | `packages/` 下收集到的 `.ts` 文件数（R5） | ≥ 1（原判据扫到 0 个时 problems 为空 → 静默通过） |
| `check-editor-module-effects.mjs`（第二批） | `packages/editor/src` 下 `.ts` 文件数（R2 编辑器侧） | ≥ 1 |
| `check-docs-links.mjs`（第二批） | `walk(ROOT)` 扫到的 `.md` 文件数（§14） | ≥ 1（0 个时 broken 为空 → exit 0） |
| `check-strict-packages.mjs`（第二批） | `packages/*` 下带 `tsconfig.json` 的包数（R6） | ≥ 1 |
| `check-register-logic-factory.mjs`（第二批） | 各包 `src`/`test` + `examples/src` + `test` 下 TS 文件数（#653） | ≥ 1 |

- 公共判据 `scripts/scan-volume.mjs`：`describeScanVolume`（纯函数）+ `assertScanVolume`（不达标即 exit 1）。
  阈值优先表达「**应为正数**」（`min` 默认 1），**不写死具体数字**——具体数字会随仓库变大而过期；
- 判据层用例 `test/scanVolume.spec.ts`（27 条）：纯函数分支 + 子进程断言「扫到 0 个 → 退出码非 0」
  + **合成临时仓库**跑 8 个真实脚本（空 `packages/`、空 `packages/editor/src`，以及把
  `check-docs-links.mjs` 复制进不含 `.md` 的目录）+ 11 个脚本的接线断言。第二批新接的 5 个
  断言都排在**读清单 / 基线之前**，于是空扫描根就能干净驱动，测试不必铺那些产物；
- **不适用 / 已有自证**（逐条核实过，不是漏做）：`check-layer-deps.mjs`（读固定清单，读不到 `package.json` 直接抛错，
  走不到空集合分支）、`check-tree-shaking.mjs`（已有「显式引入 `@feng3d/terrain` 后产物必须含 `TerrainGeometry`」
  的方法自证）、`check-runtime-half-deps.mjs`（扫到 0 个是合法状态，注释已写明理由）、
  `check-pure-modules.mjs`（登记项下没有 `.ts` 已判失败）、`check-editor-publish-files.mjs`
  （已有「扫到了运行时才取的仓库内路径（否则这条检查是空转）」）；
- **第一批**做了 R1 / R2 / R3 三个"机器执行者"族里危害最大的 6 个（元规则点名保护率最低的一组）；
- **第二批（本批）补上 5 个**已确认「有目录遍历、集合为空即静默通过」的欠账（即上表标「第二批」的行）：
  `check-effect-inventory.mjs`（R5）、`check-editor-module-effects.mjs`（R2 编辑器侧）、
  `check-docs-links.mjs`（§14 文档链接）、`check-strict-packages.mjs`（R6）、
  `check-register-logic-factory.mjs`（#653 的工厂形态，已有判据自检、无扫描量自证）；
- **仍欠账**：其余 `check-*.mjs`（现约 37 个）尚未逐条核实是否存在同类空集合分支（全量清单见 issue #652）。

#### 做法 4：退出码回归（临时仓库 + `spawnSync`，本批新增）

判据层单测（`test/r2ModuleScope.spec.ts`）与脚本内的合成样例自检都**在各自进程里**断言判据结果，
**不经过 `process.exit`**；`test/scanVolume.spec.ts` 的合成 cwd 也只证明了「扫描量自证」这一条退出码。
于是「判据命中 → 真的 `exit 1`」这条接线此前只能靠人读代码。本批新增
`test/gateExitCodes.spec.ts`（7 条），用 `mkdtempSync` 造临时仓库 + `spawnSync(process.execPath, ...)` 跑完整脚本：

| 脚本 | 用例 | 断言 |
|---|---|---|
| `check-module-side-effects.mjs` | 模块级 `new Map()` / 函数体内 `new Map()` / 违规但不带 `--strict` | `--strict` 违规 exit 1；干净 exit 0；默认模式只报告、exit 0（CI 用的正是前者） |
| `check-toplevel-new.mjs` | 模块级 `new Wrapper()` / 函数体内 `new Wrapper()` | 违规 exit 1、干净 exit 0（存量冻结基线） |
| `check-math-no-class.mjs` | 新增 `export class Vector3` / 普通 `export const` | 违规 exit 1、干净 exit 0 |

临时仓库里要铺的**启动前置**（与判据无关）：`ENTRY_FILES` 的 3 个应用入口
（R2 两条脚本的 `missingEntryFiles` 反向校验）、空基线，以及 `check-module-side-effects.mjs`
名单一致性断言要读的两份对侧名单文件——**原样复制**而不是在测试里再写一份，避免测试变成
「第四份名单」（真实仓库改名单时它跟着变，`WeakSet` 那类漂移不会从后门回来）。

**破坏性验证（本批实测）**：把 `isCacheCreation` 改成恒 `false`（一处改动）后，
该组 3 条用例立刻变红——判据漏报会被退出码用例抓住，而不是静默全绿。

### 2.2 编辑器 job

`packages/editor` 在根 eslint 配置里被整体忽略（它有自己的 `eslint.config.js`）且根配置的 `ignores` 无法用命令行绕过，因此单独一步：

| 步骤 | 命令 | 是否门禁 |
|---|---|---|
| 编辑器 lint | `npm run lint --workspace feng3d-editor` | 是 |
| 字段描述表是否为最新（#147） | `node scripts/gen-objectview-schema.mjs --check` | 是 |
| 模块级注册副作用（R2，#170） | `node scripts/check-editor-module-effects.mjs` | 是 |
| AI 桥接一致性（#168） | `node scripts/editor-mcp-check.mjs` | 是 |
| 宿主形态门禁（#272 / #273 / #274 / #276 / #277 / #278 / #280，共 **20 条**） | `npm run gates:host`（挂在 `prelint:ci` 钩子上，随 `npm run lint:ci` 进 CI）：`check-editor-host` / `check-bridge-relay` / `check-bridge-socket` / `check-bridge-security`（**D9 通信安全**：跨源 `Origin` / `Origin: null` / 非本机 `Host`（DNS rebinding）/ 端口不符的**负例**，外加**一次性 token** 的三条——缺 / 错被拒、带的能过，且验了"调用方端点不要求 token"这个**范围**；HTTP 与 WebSocket 握手共用 `bridge/security.mjs` 的同一份判据，另有 12 条纯函数单测）/ `check-editor-workspace` / `check-editor-host-config` / `check-editor-host-options` / `check-editor-host-methods` / `check-editor-host-batch` / `check-editor-boot` / `check-editor-plugin-tree` / `check-editor-project-build` / `check-editor-project-publish` / `check-editor-publish-files` / `check-runtime-half-deps`（含 #276 第三端边界，自带 8 条合成样例自检）/ `check-runtime-artifact` / `check-editor-no-project-script`（**#271 收尾**：编辑器不得再依赖"项目脚本（`project.js`）"那条旧链路——它要由"编辑器内浏览器 TypeScript services"编译，而**编译器本体从未加载**、D12 已取消编辑器内编译，失败还只 `console.warn`；判据 2 条 + **4 条判据自证**，只扫源码）/ `check-editor-project-shape`（**#274 P3**：新建的项目骨架必须是**标准 npm 工程**（D12）——模板里同时有 `package.json` 与 `feng3d.project.json`（决策 16：不合并）、`package.json` 里有 `scripts.build`（决策 13：构建命令由项目自己给），**并且** `EditorRS.ts` 的 `templateurls` 真的列了它们（"文件有了、清单没列"是最容易漏的一向）；判据 7 条 + **6 条判据自证**，只扫文件与源码；第 4 条守模板 `tsconfig.json` 走 `include` 通配——判据**容忍 JSONC**（砍注释 + 去尾随逗号），否则会因"合法的 tsconfig 写法"误报）/ `check-editor-dead-code`（**#280**：**已删除的模块不许复活**——本仓删东西时习惯在文档里写"不复活这段"，但在那之前它**只有纪律没有执行者**。判据 2 条（路径确实不存在 + 没人 import/re-export 它，注释与普通字符串不算）+ **4 条判据自证** + 空转检查（清单为空即失败），只扫源码）/ `editor-singleton-survey`（#278 的单例台账：引用面读数、**顶层 `new` 基线**、迁完的不许复活、**`editorRS` 不许在模块顶层被使用**——阶段 4a 把装配改成显式调用后，这一条从"启发式指路"升成了判据；**在册单例的消费面只减不增**（`MAX_REFERENCES`：`editorAsset` 1——它只剩装配点的注入键名；`editorRS` / `menuConfig` 均已迁完并移入 `MIGRATED`）——引用处数**排除注释**：注释里提到某个名字是说明，不是"谁在用它"）——前 16 条各自起真宿主进程或真打包，用临时项目目录，**不开浏览器**；最后三条只扫文件与源码 | 是 |
| 编辑器类型检查（editor 自身，#133） | `node scripts/check-editor-types.mjs`（内部跑 vue-tsc，按路径分类） | 是 |

**宿主形态门禁为什么挂在 `prelint:ci` 而不是 `ci.yml` 的独立步骤**：这 20 条是「编辑器宿主形态」那一系列
（cordis 宿主进程 / 桥接通道 / 宿主服务 / 项目构建发布 / 插件三端 / 单例迁移台账）的验收脚本，前 15 条**离线可跑**
（各自起真宿主进程或真打包，用临时项目目录，不开浏览器）。按根 [AGENTS.md](../AGENTS.md) §15 的元规则
「没有执行者的不算规范」，它们此前**只在本机跑过**——脚本在、门禁不在，等于没有。

进 CI 走的是与 `check-math-no-class.mjs` **同一条路**（见 §2.1 末尾）：改 `.github/workflows/**`
需要 `workflow` scope 的凭据，而本仓推送凭据只有 `repo` / `gist` / `read:org`，GitHub 会直接拒收
（实测 `refusing to allow an OAuth App to create or update workflow ... without workflow scope`）。
所以挂到 `prelint:ci` 钩子（质量门禁 job 第一步就是 `npm run lint:ci`），并在根 `package.json`
留一条 **`npm run gates:host`** 便于本地单跑 / 单独定位。

两点要知道：

- **只在 CI 路径上跑**：`prelint`（本地 `npm run lint` 用的那个钩子）**没有被改**，所以日常 lint
  不会多花这十几秒；`npm run lint:ci` 与 `npm run ci` 会跑。
- **失败即停**：`gates:host` 里 20 条用 `&&` 串起来，**第一条失败、后面的就不再执行**——
  红了先看是哪一条、修完再推，别把"后面没报错"当成"后面没问题"。

本地实测（Windows + 完整 `node_modules`）：20 条全绿，总耗时约 **21 秒**
（最后四条 `editor-singleton-survey` / `check-editor-no-project-script` /
`check-editor-project-shape` / `check-editor-dead-code` 只扫文件与源码，合计不到 1 秒）
（最慢的 `check-editor-project-build.mjs` 约 6 秒），对 job 的 40 分钟超时无压力。
> 接线时按 ubuntu 语义复核这批脚本，抓到一处**"只在本机 Windows 成立"**的断言并顺带修掉：
> `bin/host/projectWorkspace.mjs` 原用 `node:path` 的 `isAbsolute` 判绝对路径，而它在 posix 下
> 不认 `C:\Windows\win.ini` / `\\server\share`（见 `check-editor-workspace.mjs` 的「拒绝绝对路径（Windows 形式）」）。
> 这正是"门禁不进 CI 就没人知道"的实例。

**最后一条也已接线**：`scripts/editor-slots.mjs --open`（#276 S2b 的界面判据）跑在 **dev server** 上，
只能加进 `editor-e2e` job——那要改 `.github/workflows/**`，需要带 `workflow` scope 的凭据。凭据到位后
已接上（见 §2.3 表格里那一行，`.github/workflows/ci.yml` 的 `editor-e2e` job）。至此 **#276 三条验收的
守门脚本全部有 CI 执行者**：验收①（宿主装卸不残留）走 `check-editor-plugin-tree`，验收③（两端 `__type__`
都有行为）走 `check-runtime-artifact`，验收②的界面那一段走本步。

**模块级注册副作用为什么按 AST 而不是正则**：判据是「**模块顶层**有没有注册调用」——
函数/类/对象内部调用 `registerXxx` 是正常的（那是运行时逻辑）。正则要判断"这行在不在函数里"
就得自己做大括号配对，做不到；TypeScript 的 AST 一行就能问清。唯一允许的安装点是应用入口
`vue-app/main.ts`（它就是干这个的），白名单会**反向校验**：登记的文件必须存在且确实还有注册调用，
否则报"过期登记"——免得白名单变成"把报错文件名贴进来"的后门。

**这条门禁要拦的是什么**：`registerLogic` 写在文件末尾是最自然的写法，代价是"编辑器有哪些 Logic"
取决于 import 图的执行顺序——漏 import 一个文件，那个类型就静默失去行为（`logic()` 返回 `null`）。
issue #170 把 23 处 `registerLogic` 与 21 条属性面板配置搬进插件清单后，`src/**` 里除入口外已为 0 处。
（同一份脚本还会**只报告不拦**地列出模块级可变缓存容器——那是 R2 的另一半，见 #170 的范围说明。）

**AI 桥接一致性为什么必须单独一步**：桥接一边是 `scripts/editor-mcp-server.mjs` 里的 MCP 工具定义、
一边是 `src/bridge/` 里的方法总表，两边靠人手对齐。漏一个的后果是**静默的**——
AI 以为有这个工具、调用却 404，而所有单元测试都还是绿的。这一步离线可跑（不需要页面），
把工具定义、接线表、桥接源码里的方法名、以及 `docs/EDITOR_AI_BRIDGE.md` 的方法表四者互相钉住。

**`lint:ci` 依赖先构建 `eslint-plugin-feng3d`**：根 `eslint.config.js` 里
`import feng3dPlugin from 'eslint-plugin-feng3d'` 解析到该包的 `dist/index.js`，
而 `dist/` 在 `.gitignore` 中、干净检出后并不存在。因此 `lint:ci` 配了 `prelint:ci`
前置脚本先执行 `npm run build --workspace eslint-plugin-feng3d`。漏掉这一步时，
CI 会以 `ERR_MODULE_NOT_FOUND: Cannot find module .../node_modules/eslint-plugin-feng3d/dist/index.js`
失败——本地因为早已构建过 `dist/` 而看不出来，只有干净检出才暴露。

**编辑器类型检查怎么做成门禁的**（issue #133）：editor 通过 workspace 链接 import 的是
`feng3d` / `polyfill` 的**源码**（不是 `.d.ts`），vue-tsc 会顺着 import 深检这些库的
源码，报出的是它们既有的类型错误，例如：

- `packages/feng3d/src/core/View.ts` —— canvas 断言与 `HTMLCanvasElement` 不匹配
- `packages/feng3d/src/materials/StandardMaterial.ts`、`TextureMaterial.ts` ——
  `TextureField` / `Texture | TextureResource` 收窄
- `packages/polyfill/src/ClassUtils.ts` —— 未使用的 `@ts-expect-error`

这些在库自己的 `tsc` 下不出现（其 tsconfig 关闭了 `strictNullChecks` 等 4 项），
也不是 editor 自身的问题。所以这一步**不看退出码**，而是跑
`node scripts/check-editor-types.mjs`：它按路径分类——`packages/editor/**` 的错误必须为 0
（不通过则门禁变红），主仓源码的错误单列并打印前几条摘要，既不属于 editor 也不属于已知主仓
路径的错误同样判失败（避免新增来源被悄悄算成噪音）。
于是"editor 自己的类型是否干净"成了可靠指标，而库源码的类型收敛仍是独立事项（见 §6）。

### 2.3 编辑器浏览器 e2e job

`npm run test:e2e:editor`（配置：`playwright.editor.config.ts`）。它**测构建产物**而不是 dev server：起包内静态服务器（等价于用户 `npx feng3d-editor`），因为「产物加载失败 → 白屏」这类缺陷在 dev 下会被 vite 的裸导入解析掩盖。

**为什么断言只覆盖「加载层错误」**：CI 是 ubuntu headless、**没有可用 GPU**，实测会连锁报出
`WebGPU device was lost: Device was destroyed.` → `提交渲染失败：RangeError ... createBuffer`
→ `Maximum call stack size exceeded`。这些在本地（有 GPU）不出现，属环境差异。

所以用例只匹配模块解析失败 / 资源 404 / 脚本执行异常这类**加载层**错误，GPU 渲染层的问题单独立项跟踪（见 §6）。若把整串错误都设成门禁，用例会在 CI 上恒红，反而掩盖真正的产物缺陷。

**有 GPU 环境下的对照结论**（补记，供将来有人拿到 GPU runner 时参考）：

本机是一台有 NVIDIA GPU 的机器，而 **headless 的 Chromium 拿不到 WebGPU adapter**
（`requestAdapter returned null`）——要跑像素判据必须切成**有头**（自检脚本支持
`EDITOR_HEADLESS=0`）。同一批自检在两种环境下的结果对比：

| 自检 | 无 GPU（headless，CI 条件） | 有 GPU（有头，本机） |
|---|---|---|
| `editor-bridge-smoke.mjs`（89 项） | 76 通过 / 13 失败 | **89 通过 / 0 失败** |
| `editor-bridge-fuzz.mjs` | 接受 17 / 拒绝 73 | 接受 23 / 拒绝 67（多接受的是依赖画面的用例） |
| `editor-e2e-scene.mjs` | 像素判据**跳过** | **10/10**，判据三「画面有内容」真跑并通过 |
| `editor-bridge-stress.mjs` | `view.probe` / `view.screenshot` 跳过 | 全部真跑，耗时均在阈值内 |
| `editor-scene-view-cycle.mjs` | 3/3 | **修复前 2/3**（见下） |

两条重要结论：

1. **此前记为"13 条已知失败"的项，全部是无 GPU 环境限制**——有头下 89/89 全过，不是既有缺陷；
2. **有 GPU 才暴露出一层真实问题**：反复卸载/重建场景视图时刷出 **90 条 WebGPU 未捕获错误**
   （`texture size [width:0,height:0] is empty` → `CreateView` / `BeginRenderPass` / `Submit` 连锁失败），
   根因是 `ViewLogic.#update()` 在布局尺寸为 0 时把 `canvas.width/height` 写成了 0，
   而 WebGPU 的画布纹理尺寸就是它。已由 #205 修掉（90 → 0）。
   也就是说：**"无 GPU 环境看不到这一层"不等于"这一层不存在"**，有 GPU 的自检值得定期跑一次。

有效性靠**破坏性验证**保证（门禁最怕「永远绿」）：把产物入口 JS 指向不存在的文件后，用例立刻变红。注意这里有个反直觉点——**移除 importmap 不会让用例变红**，因为 feng3d 已内置进产物（#145 的修复），产物不再有该裸导入；所以验证「用例有效性」要用真正切断加载的方式。

`test:e2e:editor` 之后还有若干步，都跑在 **dev server** 上（AI 桥接中间件挂在 dev server，
静态服务器没有它），因此先后台起 dev server 并轮询 `http://localhost:3000/__editor-bridge/ping`
确就绪（`--strictPort`，端口漂移会让探测永远等不到，报出来却是「120s 超时」）：

| 步骤 | 命令 | 判据 |
|---|---|---|
| AI 桥接端到端验收（#150） | `node scripts/editor-e2e-scene.mjs --open` | 从零搭场景 + 导出→导入**往返等价**（结构自洽、画面有内容；无 GPU 时像素判据跳过，`EDITOR_HEADLESS=0` 有头时真跑——本机实测 10/10） |
| 插件贡献表自洽（#168） | `node scripts/editor-plugins.mjs --open --check` | 真浏览器里取到的贡献表：贡献点都有来源、来源都在插件列表里、id 唯一、落位已知 |
| 插槽驱动的界面（#276 S2b） | `node scripts/editor-slots.mjs --open` | 关掉一个面板插件后**界面标签真的少一个**、恢复后回来；面板标签数与贡献表面板数一致；pageerror 0（本机实测 11/11） |
| 选中同步（#173） | `node scripts/editor-selection-sync-check.mjs --open` | 关闭再打开面板后，检查器/层级树**自己恢复**到当前选中（一次性事件 + 异步组件的经典坑） |
| 场景视图反复卸载/重建（#177） | `node scripts/editor-scene-view-cycle.mjs --open` | 反复关/开「场景」面板三轮，不出现引擎侧爆栈与 `reading 'elements'` |
| 运行时装载插件（#276 验收②） | `node scripts/editor-plugin-load.mjs --open` | **不重新构建编辑器**就装上一个插件包：真插件包导入 client 半 → 登记清单 → 重投插槽 → 界面标签真的多一个，卸载后回来（本机实测 9/9） |
| 宿主装载插件端到端（#276 任务 4） | `node scripts/editor-plugin-host-load.mjs` | 真构建产物 + esbuild 打的真插件包 → 宿主注入 `window.__EDITOR_BOOT__` → 界面出现该插件贡献的面板、内置面板一个不少、零 pageerror（本机实测 6/6） |
| 运行形态（#271 P0 第三条链路） | `node scripts/editor-run-preview.mjs --url http://localhost:3000` | 纯数据场景读得出来（`objects > 0`）、渲染循环**真的在提交帧**（`frames > 10`）、**不再请求废掉的 `project.js`**；无 GPU 时按"环境限制"记，但要求 WebGPU 失败**被如实报出**（不许静默成功） |
| 页面侧 WebSocket 通道（#273 第三阶段） | `node scripts/editor-bridge-ws-page.mjs --url http://localhost:3000` | `/ping` 里能看到 `transport: websocket`（判据在**服务端记录**上，页面自己说连上不算）、HTTP 发起的调用由 WS 页面执行并回传（跨通道证明同一份命令层）、退路 `?bridgeSocket=0` 照旧可用 |
| 页面直接调宿主方法（#272 的"宿主面板"地基） | `node scripts/editor-page-host-call.mjs` | 页面里能调 `host.workspace.info` / `list`（拿到的是**项目内相对路径**）、宿主方法抛的错在页面里也如实、界面上真的多了「宿主」面板且显示的是宿主打开的项目 |

这些脚本的 `--open` 都是自己用 Playwright 开页面（桥接是**页面轮询**模型，
没有页面在轮询时所有调用都只会超时）。开页逻辑共用 `scripts/editor-bridge-page.mjs`。

**后五步为什么现在才进来**：它们此前和那 15 条离线门禁一样"只在本机跑过"——把整段写成
`ci.yml` 的步骤需要 `workflow` scope 的凭据（原因见 §2.2）。凭据到位后一次接上。
其中 `editor-page-host-call.mjs` 与 `editor-plugin-host-load.mjs` 需要**构建产物**，而本 job
第 5 步 `npm run test:e2e:editor` 已经产出 `packages/editor/public/`，所以不必再加 `--build`。

**判据的语言依赖要当心**：这几步刻意**不依赖界面文案**（用标签数量、或 `panels.host` 这种
两种语言下都一样的 key），因此换 runner 也稳；唯一断言中文文案的是 `editor-slots.mjs`，
它把页面 locale 钉成 `zh-CN`（原因见 §2.2 末尾那段的实测记录）。

**贡献表这一步不是纯逻辑测试的重复**：`packages/editor/test/pluginTable.spec.ts` 验的是表的
**语义**（离线、纯函数），而表是通过 `editor.plugins` 从**跑着的编辑器**里取出来的——
注册表接线断了、面板没进布局、来源插件丢了，纯函数测试一个都发现不了。

**插槽那一步同理，且更靠后一段**：#276 之后界面的数据来源是
「清单 → 投影 → 插槽 → 界面」。单元测试覆盖前两段（`test/slotProjection.spec.ts` /
`slotInstall.spec.ts`），**最后一段（`slots/changed` → 界面重算）只有真页面能验**
——注册表接错、界面还在读旧查询、订阅没建立，纯函数测试一个都发现不了。

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

**凭证校验放在 `verify` job**（推 tag 或手动非预演时执行），而不是 `publish`：token 失效时若等到 `publish` 才发现，前面已经白跑完 eslint + 全量单测 + 20 包构建与打包校验（约 10 分钟）。这一点是在实际踩过之后才调整的——第一次发布就因为 token 失效白跑了一整轮。

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

首次发布的包会被标出，末尾附一行可整批复制的 `npm i <21 个包@版本>`。

**第二段：自动变更说明。** `gh release create --notes-file` 与 `--generate-notes` 互斥，所以自动说明由脚本调
`POST /repos/{owner}/{repo}/releases/generate-notes` 取回后拼在台账之后（PR 归类、贡献者）。取不到时标注「（未能生成自动变更说明）」而不是静默省略；该接口失败不影响发布流程。

生成器只输出 markdown，不碰网络之外的东西，单元测试见 `test/ReleaseNotes.spec.ts`。

配置位置：仓库 Settings → Secrets and variables → Actions。

`GITHUB_TOKEN` 由 Actions 自动提供，用于最后创建 GitHub Release（`--generate-notes` 自动生成变更说明）；同名 Release 已存在时跳过。

---

### 3.7 Gitee 镜像同步（issue #107）

开发已切到 GitHub（`origin`），Gitee（`gitee` remote）降为**只读镜像**。同步由
[`scripts/sync-gitee.mjs`](../scripts/sync-gitee.mjs) 负责：fetch → 比对两侧 `master` 的 SHA → 不一致时 push → 再比对；`--dry-run` 只比对不推送。

**前置条件（需在 Gitee 网页上做一次，二选一）**：

| 方案 | 操作 | 说明 |
|---|---|---|
| ① 放开保护（推荐） | 「管理 → 分支设置」放开 `master` 的推送权限 | 实测推送被拒：`Auth error: No permission to push this protected branch`——**认证是通过的**，卡在保护分支 |
| ② 仓库镜像 | 「管理 → 仓库镜像管理」新建 **Pull** 方向镜像 | 自动从 GitHub 同步；官方提示同步超 30 分钟视为超时、大型仓库不建议，且 Pull 方向会**覆盖**目标分支 |

```bash
node scripts/sync-gitee.mjs --dry-run   # 只比对（本仓库当前处于"不一致"状态）
node scripts/sync-gitee.mjs             # 需要时推送并复核
```

退出码 0 表示两侧一致。失败结论与"下一步该做什么"由
[`scripts/sync-utils/gitee-sync.mjs`](../scripts/sync-utils/gitee-sync.mjs) 生成（纯函数，单测在
`test/GiteeSync.spec.ts`）：保护分支、认证失败、网络不可达会给出三条不同的可操作提示，
认不出的失败也有兜底文案，不会只丢一句 "push failed"。

> 注：Gitee 的 **API** 凭据在本机不可用（`GET /api/v5/...` 返回 401 `Access token does not exist`），
> 所以「改分支保护设置」这类**管理操作无法脚本化**，只能人工在网页上做一次；脚本只负责同步本身。

### 3.8 发布前的 issue 优先级复核（issue #286）

优先级标签**不会自我维持**。发布前**过一遍「阻塞」与「高」两档**，把躺着过期的处理掉
（已完成 → 关闭、重复 → 合并、已成非目标 → 改档）。低档的过期项危害有限，但这两档会直接影响排期。

```bash
# 漏标检测：任何开放 issue 没有优先级标签（或带了多个 / 非规范档位）都会非零退出并逐条列出
GITHUB_TOKEN=... node scripts/check-issue-priority.mjs

# 离线复现（不需要凭据）：先导出 JSON，再从文件读
node scripts/check-issue-priority.mjs --from tmp/issues-open.json
```

判定逻辑在 [`scripts/issue-utils/issue-priority.mjs`](../scripts/issue-utils/issue-priority.mjs)
（纯函数，单测在 `test/IssuePriority.spec.ts`）；档位定义与定级流程见
[ISSUE_PRIORITY.md](./ISSUE_PRIORITY.md)。

> 「漏标」不是假想问题：建立这套机制时实测抓到 **#337 没有优先级标签**——而它是在同一个会话里
> 刚创建的 issue。所以这条检查必须在**新建 issue 时**就跑（本地或 Action），不能只在发版前跑。

**建立这套机制时实测到的过期项**（下次复核先看它们还在不在）：
`#120`（ObjectView 配置系统，可能已由 #170 改为清单声明）、`#111` 与 `#280`（多人协作，疑似重复）、
`#109`（shader 编辑器，属 [POSITIONING.md](./POSITIONING.md) §5 明确的非目标）。

---

## 4. 打包内容校验

发布前会校验 tarball 对使用者确实可用，任一不通过即失败：

1. tarball 非空、含 `package.json`；
2. 发布时 `package.json` 指向的每个入口文件（`main` / `module` / `types`）都真的在 tarball 里；
3. 入口所在目录被 `files` 字段覆盖；
4. 含 `src/` 目录（本仓库采用**源码发布策略**：入口指向 `./src/index.ts`，下游按源码引用，见 AGENTS.md 第 14 章）。

### 4.1 已修的真实缺陷：`eslint-plugin-feng3d` 发布后不可用

`packages/eslint-plugin-feng3d` 的 tsconfig 是 `noEmit: false` + `outDir: "dist"`（22 个包里唯一真正产生产物、入口指向 `dist/` 的包），但它的 `files` 字段是 `["src", "lib"]`——**没有 `dist`**。

后果：发布出去的包里根本没有 `dist/index.js`，而 `main` / `exports.import` 都指向它，安装方一 `import` 就报模块不存在。这个包能发布成功，却完全不可用。

已修：`files` 改为 `["src", "dist"]`，并在发布脚本里加上第 3 条校验，防止同类问题再次溜过去。

---

## 5. 编辑器（`feng3d-editor`）的发包

编辑器与前 19 个库包形态不同：它是 **Web 应用**（Vue 3 + Vite 多页面入口 `index.html` / `run.html`），不是可 `import` 的库。

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
| 库源码类型错误（被 editor 深检暴露） | **15 条已进精确白名单**（issue #360）：`check-editor-types.mjs` 按「路径 → 允许条数」白名单，**白名单之外的主仓错误一律失败**；其中 `polyfill/ClassUtils.ts` 的 2 条是**两套 tsconfig 严格度差异造成的固有假阳性**（那两行 `@ts-expect-error` 在 polyfill 自己的 tsconfig 下必需，不能删），其余 13 条是真待办 | 白名单**过松或已无对应错误时会告警**（防止它被当垃圾桶越写越宽）|
| 源码发布策略的下游要求 | 发布包入口指向 `./src/index.ts`，`exports` 只有 `import` / `types`，无 `require` | 下游必须是能编译 `node_modules` 里 TS 源码的打包器（如 Vite）；纯 Node / 老 webpack 用不了 |
| 编辑器包体积 | tarball 781 个文件（含 `src`、`projects`、`resource`） | 安装体积偏大；如需精简可收窄 `files` |
| 各包版本号历史混乱 | `feng3d` 发过日期式版本号（如 `201810.3.0`），且本地版本普遍落后于 npm（本地 0.6.0 vs npm latest 0.9.0） | 版本号无法用来推断新旧；发布与打包校验都以 npm `latest` 标签为锚点（见 §3.2.1） |
| e2e 未纳入 CI | `playwright.config.ts` 与 `e2e/` 存在，但 CI 只跑单元测试 | 视觉回归 / 端到端行为没有门禁 |
| `EFFECT_INVENTORY.md` 一致性校验 | ✅ 已落地（#79）：`node scripts/check-effect-inventory.mjs` 进质量门禁 | 清单与代码脱节即失败 |

---

## 7. 本地怎么跑同一套检查

```bash
npm ci

# `npm run ci` 只是 quality job 的**子集**（lint:ci + 示例入口可解析 + test:coverage +
# types:packages + build:packages + release:dry-run；lint:ci 还会顺带跑 gates:host、
# check-math-no-class、check-readonly-array-fields、check-pure-modules 与 check-register-logic-factory）。它**不含** R1/R2/R3/R5/R9/R11 的那批脚本、lint:examples、
# 分包覆盖率一致性、工作区污染检查——逐条对照见 §2.1，要完整复现 quality job 就按 §2.1 的步骤顺序挨个跑。
npm run ci

# 单独跑（括号里是 §2.1 的步骤号）
npm run lint:ci          # eslint，零警告（含 gates:host 20 条宿主门禁 + check-math-no-class + check-readonly-array-fields + check-pure-modules + check-register-logic-factory）
npm run lint:examples    # 示例 eslint（examples/src/**/*.ts，零警告，§2.1 第 8 步）
node scripts/check-examples-imports.mjs   # 示例入口可解析（等价 Vite dev 的依赖扫描）
node scripts/check-docs-links.mjs         # 文档相对链接（第 2 步）
node scripts/check-effect-inventory.mjs   # R5（第 3 步）
node scripts/check-module-side-effects.mjs --strict   # R2（第 4 步）
node scripts/check-tree-shaking.mjs       # R2 产物级（第 5 步）
node scripts/check-doc-status-labels.mjs  # R11（第 6 步）
node scripts/check-layer-deps.mjs         # R1（第 7 步）
node scripts/check-strict-dirs.mjs        # R6（第 9 步）
node scripts/check-strict-packages.mjs    # R6（第 10 步）
node scripts/check-layer-direction.mjs    # R1（第 11 步）
npm run test:coverage    # 全量单元测试 + 覆盖率门禁（阈值与现状见 §1.3，第 12 步）
node scripts/coverage-by-package.mjs --check   # §1.3 覆盖率表一致性（第 13 步）
npm run test:run         # 只要测试结果、不要覆盖率门禁时用这个
npm run types:packages   # 21 个包类型检查（第 14 步；editor 无 types 脚本）
npm run build:packages   # 22 个包构建校验（第 15 步）
node scripts/check-toplevel-new.mjs       # R2 其余模块级 new（第 16 步）
node scripts/check-imperative-construction.mjs   # R3（第 17 步）
node scripts/check-math-no-class.mjs      # math 数值 / 几何禁 class（第 18 步，prelint:ci 已跑一次）
node scripts/check-readonly-array-fields.mjs      # 只读数组字段（§11.6 / issue #605，prelint:ci 已跑一次）
node scripts/check-pure-modules.mjs      # R13 纯函数层（prelint:ci 已跑一次）
node scripts/check-register-logic-factory.mjs     # registerLogic 只接受工厂函数（issue #653，prelint:ci 已跑一次）
node scripts/check-bundle-size.mjs        # R9（第 19 步）

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
