# 全局单例迁服务（#272 P5）

> 状态：**评估稿（2026-10-02）**。本文只描述现状、顺序与验收，**本阶段不含代码改动**。
>
> 台账里的每个数字都来自 `node scripts/editor-singleton-survey.mjs`——跑一遍就能复现，
> 没有一个是手数的。这条纪律是有代价换来的：写脚本时用 PowerShell 数过一次，
> 因为 `Select-String` **默认大小写不敏感**，把 `EditorRS`（类）也算成了 `editorRS`（单例），
> 于是"测试里有 6 处引用"这个**不存在的债务**差点进了台账（真实是 0 处）。
>
> **这条台账现在还是 CI 门禁**（#278 第一步）：`editor-singleton-survey.mjs` 是根 `package.json`
> 里 `gates:host` 的**第 16 条**，随 `prelint:ci` 在质量门禁 job 跑。于是 `MIGRATED` 反向校验、
> **顶层 `new` 基线**、`EDITORDATA_MAX_REFERENCES` 都会在漂移时直接让 `npm run lint:ci` 失败——
> "迁移清单可查"从文档纪律升级成了机器判据。

## 0. 一句话结论：`NODE_HOST.md` 的 P5 那句话需要修正

P5 原话是"`EditorData` / `editorui` / `editorRS` / `editorcache` 逐个迁为服务"。
实测下来它们**不是同一类东西**，"迁服务"对其中两个甚至不是正确的目标：

| 单例 | 外部引用 | 它**其实**是什么 | 目标应该是什么 |
|---|---|---|---|
| `editorData` | **76 处 / 24 文件** | **已经是 Pinia 的过渡层**——`@deprecated 请直接使用 useEditorStore()`，内部 getter 转发给 Pinia store | → **Pinia**（继续清消费方）。**不是** cordis |
| `editorRS` | 45 处 / 10 文件 | 页面侧资源系统实例（`extends ReadWriteRS`），并在**模块顶层**把自己挂给引擎（`ReadRS.rs = editorRS`） | → 服务（**页面侧**容器）＋ 那条顶层赋值改成**显式注入** |
| `editorcache` | 19 处 / 5 文件 | 偏好持久化（localStorage + `beforeunload`） | ✅ **已 lazy**（#272 P5 第 2 步）：入口变成 `getEditorCache()`，模块顶层不再构造。见 §3 第 2 步 |
| `editorui` | ~~11 处 / 4 文件~~ → **19 处 / 6 文件** | **兼容空壳**：只有 `assetview.invalidateAssettree` 有实现，其余 5 个字段（`stage` / `mainview` / `tooltipLayer` / `popupLayer` / `messageLayer`）靠 `<any>` 断言"假装存在" | ✅ **已删**（#272 P5 第 1 步）——实测细节见 §3 第 1 步 |

一句话：**P5 不是"四件事同一件"，而是"一件清理 + 一件去副作用 + 一件已在别的路上 + 一件真迁移"**。

## 1. 现状（实测）

```
单例            引用处数  文件数  测试引用  角色
editorData              0       0         0  ✅ 已迁完（登记在 `MIGRATED`，上限 0）
editorRS               54      10         0  页面侧资源系统
getEditorCache         15       5         0  偏好持久化（✅ lazy 单例；文件数不变 = 消费方一个没漏）
editorui                0       0         0  ✅ 已删（#272 P5 第 1 步，由反向校验守着）
```

> ⚠️ **口径**：数字**含 `.vue`**。本文第一版只扫 `.ts`，于是把 `editorui` 在
> `App.vue` / `SceneView.vue` 里的消费者整个漏掉（台账 11 处，真实 19 处）。
> 已修进脚本注释——**"台账少算消费方"比没有台账更危险**：它会让人以为一步就能迁完。

**爆炸半径**（每个单例引用最多的文件，也就是每步要重点改的地方）：

| 单例 | 引用最多的三个文件 |
|---|---|
| `editorData` | `shortcut/Editorshortcut.ts`(13)、`feng3d/mrsTool/MRSToolTarget.ts`(9)、`configs/CommonConfig.ts`(5) |
| `editorRS` | `ui/assets/EditorAsset.ts`(15)、`ScriptCompiler.ts`(8)、`configs/CommonConfig.ts`(7) |
| `editorcache` | `configs/CommonConfig.ts`(7)、`assets/EditorRS.ts`(4)、`Editor.ts`(4) |
| ~~`editorui`~~ | 已删。它删之前最多的是 **`vue-app/App.vue`(7)**——正是"只扫 `.ts`"会漏掉的那个文件 |

`configs/CommonConfig.ts` 出现在**所有在册单例**的引用榜上——它是"编辑器启动装配"那一处，
每步都会碰到它；这也说明**迁移顺序里它会被反复改**，值得先把它的职责看清。

**依赖矩阵**（决定顺序）：

```
editorData    -> （无）
editorCache   -> （无）
editorRS      -> editorcache        ← 唯一的单例间依赖
```

**模块顶层使用**（启发式扫出来的只有一条，但那一条是硬的）：

```
packages/editor/src/assets/EditorRS.ts:198: ReadRS.rs = editorRS
```

这是"页面侧单例 → 引擎全局"的桥：`ReadRS.rs` 是引擎的资源系统静态槽位。
它让"谁在用资源系统"变成隐式的（引擎内部直接读静态槽位），**迁移的最后一步绕不开它**。

## 2. 前置依赖：页面侧现在**没有** cordis 容器

`NODE_HOST.md` §4 的结论是"cordis 接管服务端，**并在 Web 端同样作为插件容器**（dual-half）"。
现状是：**宿主侧**已经有 cordis（`bin/serve.mjs` 里的 `Context` + 若干 `Service`），
而**页面侧**用的是自研的模块表（`src/plugins/loader/moduleTable.ts`），**没有 cordis 容器**。

所以在页面侧谈"迁 cordis Service"之前，得先决定一件事：

| 路线 | 做法 | 代价 |
|---|---|---|
| **A（推荐，先做）** | 页面侧**不引入 cordis**，先把"全局单例"改成**显式传入/显式注入**（构造参数或一个极薄的容器） | 达不到"插件可替换服务"的程度，但**立刻**消掉隐式依赖与模块级副作用 |
| B | 页面侧也起一个 cordis 容器（浏览器 ESM 版 cordis 实测 27.2 KB、无 `node:` 引用） | 一步到位，但要把"服务注册/取用"的时机接到启动流程（`main.ts`），并且**与既有 Pinia 的边界要划清**（Pinia 管状态，服务管能力） |

**本文建议 A**：P5 的第一目标其实是"消掉隐式全局"，而不是"用上 cordis"。
把 A 做完，B 就是一个纯粹的替换（容器换了，消费方签名不变）。

## 3. 建议顺序（四步，每步独立可验收）

### 第 1 步：`editorui` 直接删 ✅ **已完成（2026-10-02）**

它**不是服务**，是空壳：只有 `assetview.invalidateAssettree` 转发到
`vue-app/views/ProjectViewAdapter`，其余字段没有实现。

**动手时实测到两件比评估更清楚的事**（本文初稿只写了"检查有没有人读那 5 个字段"）：

1. **那 4 个字段是"只写不读"的死字段**——`Editor.ts` 给 `tooltipLayer` / `popupLayer` /
   `messageLayer` / `mainview` 赋值，而**没有任何地方读它们**（`mainview` 唯一一次"读"
   就是赋值行本身）；
2. **`App.vue` 里那段真的读它们的代码，守卫恒假**：
   ```ts
   if (editorui.stage) { /* ... */ }   // stage 从来没被赋过值 ⇒ 整个块从不执行
   ```
   所以它是**死代码**——这也解释了为什么删掉它"行为零变化"。`SceneView.vue` 那个 import
   同样是死 import（引了、没用）。

**做法**（与初稿一致，只是多处理了 `.vue` 那两处）：

1. `configs/CommonConfig.ts` 的 3 处 → 直接调 `invalidateAssettree()`；
2. `Editor.ts`：删 3 个死字段赋值 + 删 `initMainView()`（它只赋 `mainview`）；
3. `App.vue`：删 import + 删 `handleResize`（恒假那段的载体）+ 连带删空的 `onUnmounted`；
4. `SceneView.vue`：删死 import；`index.ts`：删 `export * from './global/editorui'`（公共 API）；
5. 删 `src/global/editorui.ts`。

- **验收**：普查脚本里 `editorui` **0 处 / 0 文件**，且新增的**反向校验**守着"它不许复活"
  （定义文件不在 **且** 没人 import 它）；CI 全绿。
- **风险**：低（已兑现）。**一条可复用的经验**：`<any>` 断言会把"字段其实不存在"藏起来，
  所以"有没有人读"必须真的去搜，不能看类型。
- 脚本里的 `MIGRATED` 清单就是"第 1 步已完成"的**机器记录**（谁把空壳加回来，普查会红）。

### 第 2 步：`editorcache` 去模块级 `new` ✅ **已完成（2026-10-02）**

`export const editorcache = new EditorCache();` 是模块顶层执行代码（R2 的既有违反项）。
改成 lazy：

```ts
let cache: EditorCache | null = null;
export function getEditorCache(): EditorCache { return (cache ??= new EditorCache()); }
```

**做的时候确认了一件评估时只能猜的事**：`check-module-side-effects.mjs --strict` **并没有**
覆盖这一处——它的规则只匹配 `new Map/WeakMap/Set/ChainMap()` 这类容器，所以 `new EditorCache()` 一直**没有执行者**
（连门禁的"存量统计"里都没有它）。于是这一步顺带补了一个：

> `scripts/editor-singleton-survey.mjs` 的**「顶层 `new` 基线」**（`TOP_LEVEL_NEW_BASELINE`）：
> 哪几个在册单例的定义文件里还有顶层 `new`。实测集合与基线**必须一致**——多了 = 新增违规，
> 少了 = 该收紧基线却没收紧；迁移一步就划掉一个。与 `imperative-construction-baseline.json` /
> `bundle-size-baseline.json` 是同一套做法。

- **验收**：入口 `getEditorCache` 的**文件数不变（5 个）**（证明消费方一个没漏）、
  顶层 `new` 基线从 `['editorRS', 'editorcache']` 收紧成 `['editorRS']`；
  新增单测 `packages/editor/test/editorCache.spec.ts`（同一实例 / `setLastProject` 去重 /
  `save` 的持久化往返——这条路此前**一条测试都没有**）；CI 全绿。
- **风险**：低（已兑现）。消费者从 `editorcache.xxx` 改成 `getEditorCache().xxx`（19 处 / 5 文件）；
  相邻多次读取的地方顺带收成局部变量 `const cache = getEditorCache();`。
- **没有一起改的是** `beforeunload` 那段（`typeof window !== 'undefined'` 守卫）：它仍在模块顶层
  注册监听器——**"显式注册监听"与"模块级副作用"是两件事**（见根 AGENTS.md §R2 的边界说明）。
- **顺带发现（留给第 4 步）**：`editorRS` 的定义文件里有**两处**顶层 `new`——
  `export const editorRS = new EditorRS();`（197 行）与 **`FS.fs = new ReadWriteFS();`（198 行）**。
  后者是"页面侧 FS 装配"，第 4 步要把这两处一起想清楚（门禁把它们都记在同一条基线上）。

### 第 3 步：`editorData` → Pinia ✅ **已完成（76 → 0）**

**这条路编辑器自己已经在走**（`EditorData` 的 JSDoc 写着 deprecated、内部转发 Pinia）。
P5 在这一步的角色不是"迁"，而是**登记进度 + 设一个可查的终点**：

- 终点判据：普查脚本里 `editorData` 的引用面**归零**（= 没人再 import 那个过渡层）；
- **防回退判据**：脚本里的 `EDITORDATA_MAX_REFERENCES`——实测**超过**上限即失败
  （每迁一批就收紧一次）。取"**处数**"而不是"文件数"：同一文件里多写一处也该被抓住，
  文件数会掩盖它；
- 做法：按引用榜从多到少逐个换成 `useEditorStore()`。

**第 1 批已完成（2026-10-02）**：`shortcut/Editorshortcut.ts`（13 处），
引用面 **76 处 / 24 文件 → 63 处 / 23 文件**，上限收紧到 **63**。

手法：有 action 的用 action（`toolType = X` → `setToolType(X)`；`clearSelectedObjects()` /
`selectMultiObject()` 原样对应）；同一方法里多处读取的取一次 `const store = useEditorStore()`
（`onCopy` / `onPaste`）。

**同一批里撞到一件事：`MRSToolTarget.ts`（9 处）迁不了。** 它会被单元测试经 `logic()`
间接构造（`packages/editor/test/pluginPatch.spec.ts`），而测试环境**没有激活 pinia**，
`useEditorStore()` 当场抛 `getActivePinia() was called but there was no active Pinia`。
这正是本文初稿"风险②"的实证：**`EditorData` 在 pinia 未激活时静默降级（返回空对象 fallback），
而 `useEditorStore()` 直接抛错**。

对 `Editorshortcut` 没问题（它只在 `Editor.init()` 之后被 `new`，而且**没有任何测试构造它**
——已核对）；对 `MRSToolTarget` 就不成立：它的构造时机**不由编辑器控制**
（`logic()` 可以在任何地方被调用，包括测试与 `run.html` 的运行形态）。

**所以这一步的真正判据不只是"引用面下降"，还有全量测试**——它会替你在"没有 pinia 的环境"里
把这些类构造一遍。那 9 处要么等 pinia 在测试里可激活，要么**先让它不依赖 pinia**
（后者才是 P5 的本意：显式注入，而不是从空气里取全局）。

**第 2 批已完成（2026-10-02）**：三个 **Vue 组件**——`vue-app/views/SceneView.vue`(4)、
`vue-app/components/TopToolBar.vue`(1)，以及 `vue-app/components/CameraPreview.vue` 里
**三条注释**（那 3 处其实不是消费方：是被注释掉的旧代码加一条历史说明——普查是文本级匹配，
注释也算，见 §6）。引用面 **63 → 55 处 / 20 文件**，上限收紧到 **55**。

**为什么先挑 Vue 组件**：它们最不可能被单测加载（已核对：`packages/editor/test` 里没有任何
`import` 指向 `.vue`）。这条"**先问会不会被测试构造、再用全量测试验证**"的规程，
就是第 1 批 `MRSToolTarget` 撞出来的。

⚠️ **这批又撞到第二个坑：两套响应式系统不通。**
`SceneView.vue` 原先用**引擎的** `watcher.watch(EditorData.editorData, 'gameScene', …)` 监听场景变化；
把监听对象换成 pinia store 之后，**回调再也不触发**——因为 pinia store 是 **Vue 的响应式**
（`@vue/reactivity`），而引擎的 `watcher` 建在**自研响应式**（`packages/reactivity`）之上。
代价是**编辑器 e2e 直接红了两条**（「默认场景已加载到层级树」「检查器在层级树之后挂载时也要显示
当前选中（#173）」）：层级树拿不到 `rootGameObject`。修法：改用 **Vue 的 `watch`**
（`watch(() => editorStore.gameScene, onGameSceneChanged)`，并在 `onUnmounted` 里停掉），改完 e2e 7/7。

> 这是同一个"语义变化"的两个面：`EditorData` 那层不仅**容错**（pinia 未激活时降级），
> 它还是**普通对象**（对引擎的 `watcher` 友好）；换成 pinia store 后这两条性质同时变了。
> **判据仍然是测试**：**单测**抓第一种（无 pinia 时构造），**e2e** 抓第二种（响应式系统不通）。

**第 3 批已完成（2026-10-02）——"高风险区"原来是纸老虎**：4 个 `scripts/*Icon.ts` +
`feng3d/mrsTool/{MRSTool,MRSToolTarget,editorSetTool}.ts`（共 26 处，**含第 1 批还原掉的那 9 处**），
引用面 **55 → 30 处 / 13 文件**，上限收紧到 **30**。

**第 1 批判定"这些迁不了"时，结论对、但原因说浅了。** 真正的机理是：

- `pluginInstall.spec.ts` 会**遍历插件清单里的每个 Logic 并构造**（`logic({ __type__: entry.name })`）
  ——那 23 个 Logic 分布在 17 个文件里，全在里面；
- 而测试环境**没有 pinia** ⇒ `useEditorStore()` 当场抛错。

**所以解法不是"别迁"，而是"测试要提供编辑器运行时的前提"。** 在 `pluginInstall.spec.ts` 与
`pluginPatch.spec.ts` 的 `beforeEach` 里补 `setActivePinia(createPinia())` 之后，这些 Logic
与普通消费方一样能迁。

**这个决定的安全性靠一条事实：运行形态（`src/run.ts`）不装 pinia，但它也不加载编辑器清单**
——它只注册**引擎** Logic、把纯数据场景交给 `logic()`。所以"没有 pinia"对**引擎**是真实状态，
只有"会构造编辑器 Logic 的测试"需要补。✅ 已核对 `run.ts` 全文（它只 import `@feng3d/webgpu` 与 `feng3d`）。

**一条纪律（差点踩）**：`setActivePinia` 是**全局**的，所以**每个会构造 Logic 的测试文件都要自己激活**，
不能指望"别的文件已经激活过"——那会让用例**依赖执行顺序**。（第 1 批我只改了 `pluginInstall.spec.ts`，
而 `pluginPatch.spec.ts` 单跑也过——那是因为 `MRSToolTarget` 当时还没迁、仍走 `EditorData` 的 fallback；
这一批迁完之后它就必须自己激活，已补。）

**第 4 批已完成（2026-10-02）**：`bridge/**`（6 个文件 11 处：`EditorBridge`、
`read/{editorRead,readCore,sceneRead}`、`write/{writeMaterial,writeMisc}`）、
`configs/CommonConfig.ts`(5)、`feng3d/hierarchy/Hierarchy.ts`(5)
——引用面 **30 → 9 处 / 5 文件**，上限收紧到 **9**。

**这一批的排查方式已经成形**（是前面几批踩出来的，值得照做）：

1. 先看**有没有测试直接 import 这个文件**（`git grep "from '../src/xxx'" -- packages/editor/test test`）；
2. 再看它**会不会经清单 / `logic()` 被间接构造**（`pluginInstall.spec.ts` 遍历清单那一条）；
3. 最后**用全量测试 + e2e 兜底**：单测抓"无 pinia 构造"，**e2e 抓"两套响应式不通"**。

本批 8 个文件两边都不沾，所以一次通过。

**第 5 批（收尾）已完成（2026-10-02）——`editorData` 的消费面归零 ✅**：
`Editor.ts`(2)、`ui/assets/EditorAsset.ts`(2)、`feng3d/EditorView.ts`(2)、`ScriptCompiler.ts`(1)、
`utils/createDefaultScene.ts`(2 处**注释**)。**76 → 0 处**，`EDITORDATA_MAX_REFERENCES` 收到 **0**，
`editorData` 从"在册单例"移进 `MIGRATED`。

这批有两个细节值得记：

- **`feng3d/EditorView.ts` 上那个 `get editorData()` 是死 API**——全仓没有任何 `xxx.editorData`
  调用点（已核对），所以直接删掉；它一起带走了那个 import；
- **`EditorData.ts` 本身不能删**：它还替全仓 re-export `MRSToolType`（`export { MRSToolType }`），
  5-6 个文件**合法地** import 它取枚举。所以 `MIGRATED` 里这一条只要求"**没人用过渡入口
  `EditorData.editorData`**"，**不要求文件消失**——为此给 `MIGRATED` 加了两种口径：
  `fileGone`（文件必须已删）与 `detect`（`import` / `transition-entry`）。

**判据**：普查 10/10（`editorData` 已登记在 `MIGRATED`、上限 0、反向校验守着"没人再用过渡入口"）；
全量测试通过；**e2e 7/7**。

> ⚠️ **破坏实验这批连续三次"自己失效"，其中一次暴露了判据的真实缺口**：
> ① 只加 `import { EditorData }` **不算**复活（那个模块还提供 `MRSToolType`，好几个文件合法地 import 它）；
> ② 于是判据改成"**真的用了 `EditorData.editorData`**（排除注释行）"——这才是"复活"的定义；
> ③ 而**实验本身也得改成"真的用一次"**才能命中它。
> **教训**：破坏实验必须落在**判据的口径**内，否则"没抓住"看起来像判据失效，其实是实验没打中。

- **验收**：引用面**单调下降**（每批一次提交，脚本读数可对照）+ 上限收紧；CI 全绿。
- **风险**：中。替换是机械的，但有三类要当心：
  ① `EditorData` 里有几处**不是**纯状态转发（如 `editorData.openScript` 这类带行为的入口），
  要落到对应 store action 而不是照抄字段名；
  ② **语义变化（本批被实测撞到）**：`EditorData` 在 Pinia 未激活时会**静默降级**（返回空对象
  fallback），而 `useEditorStore()` 会**直接抛错**。这不是理论风险——`MRSToolTarget`（9 处）
  就是因为"**单元测试会构造它**"而迁不动的（见上文）。所以每迁一处都要先问一句：
  **它会不会在没有 pinia 的环境里被构造？** 判据就是全量测试；
  ③ **依赖变硬**：`src/feng3d/mrsTool/MRSToolTarget.ts` 现在直接依赖 `vue-app/stores`——
  原来它经 `EditorData` 过渡层（语义等价），但这让"引擎适配目录依赖 UI 层"更显式；
  若将来要划这条分界，这里就是入口。

### 第 4 步：`editorRS` 迁服务（45 处 / 10 文件，最难）

> **阶段 4a 已完成（2026-10-05）**：模块顶层那两行**写全局**的语句
> （`FS.fs = new ReadWriteFS()` 与 `ReadRS.rs = editorRS`）已移进**显式装配**
> `installEditorResourceSystem()`，由入口 `vue-app/main.ts` 调用（在 `pickBaseFS()` **之前**）。
> 执行者：`editor-singleton-survey.mjs` 新增判据"**`editorRS` 不许在模块顶层被使用**"（0 行才算过）
> ——它把这一条从"启发式指路"升级成了**判据**；`check-toplevel-new` 的基线同步收紧一处
> （`EditorRS.ts::ReadWriteFS`）。另补 `test/editorRS.spec.ts`（4 条：装配显式 / 幂等 /
> 装完槽位真的指向它 / 模块顶层不再写全局）。
>
> **阶段 4b 第一批（2026-10-05）**：`Editor` 改成**构造注入** `EditorRS`
> （`new Editor(rs)`）；装配点 `App.vue` 用的是 `installEditorResourceSystem()` 的
> **返回值**，而**不是** import 单例——否则那只是"把引用挪个地方"，不叫去单例化
> （第一版就是这么写的，实测引用数**从 45 涨到 46**，当场改掉）。
>
> 同批给门禁立了 **`EDITORRS_MAX_REFERENCES = 44`**：消费面**只减不增**，
> 每批往下压一次——与 `EDITORDATA_MAX_REFERENCES` 同一条纪律（45 处不可能一次改完，
> 没有上限时"顺手加一处 import"会把进度悄悄抹掉）。读数：**45 → 44 处**。
>
> **阶段 4b 第二批（2026-10-05）**：给 Vue 组件铺**注入通道**——新增
> `vue-app/composables/useEditorRS.ts`（`editorRSKey` + `useEditorRS()`），装配点 `main.ts` 用
> `app.provide(editorRSKey, installEditorResourceSystem())`（**用返回值**，不 import 单例）；
> `InspectorView.vue` 改成 `useEditorRS()`。取不到时**当场抛**（装配错误不该静默），
> 另有 2 条单测用 `app.runWithContext()` 守着（**不挂载组件**——单测环境是 node、没有 DOM）。
> 这条通道是**可复用**的：剩下几个 Vue 组件（`TopToolBar` / `OAVPick`）照它改即可。
>
> **同批修正了台账口径**：`countByName` 原来把**注释里**提到的名字也算进"引用处数"，
> 于是"多写一句解释"会让台账涨一处（实测我新写的注释就贡献了 2 处）。现在与"顶层使用"
> 那一栏口径一致：**先砍行尾注释、再排除整行注释**。修正后 `editorRS` 的读数是
> **37 处 / 6 文件**（旧口径 44 处 / 11 文件——那 5 个文件只在注释里提到它），
> `EDITORRS_MAX_REFERENCES` 随之收到 **37**。
>
> **为什么"引用面归零"不能在同一步做完**：`ReadRS.rs` 是**引擎侧**的静态槽位
> （`packages/assets/src/rs/ReadRS.ts:18` 就有 `static rs = new ReadRS()` **默认实例**），
> 引擎内部多处直接读它（`AssetData.ts:20`、`FileAsset.ts:202`、`ReadRS.ts:221`）。
> 要归零必须先改**引擎**——那是跨包改造，不是 editor 一个包的事。所以本步只做到
> "**页面侧不再隐式写全局**"，并把剩下的边界与理由写在这里。

它有两个性质让这一步最麻烦：

1. **被引擎反着用**：`ReadRS.rs = editorRS`（模块顶层）让引擎内部直接读静态槽位——
   迁移必须把这条改成**显式注入**（谁用资源系统，谁拿；而不是"从空气里取"）；
2. **它依赖 `editorcache`**：所以第 2 步要先做完。

- **做法**：按路线 A 先"去单例化"（消费方改成接收一个 `EditorRS` 实例），最后再决定要不要套容器；
- **验收**：`ReadRS.rs = …` 这条顶层赋值消失（脚本的"模块顶层使用"一栏为空）；
  引用面归零；`EditorAsset` / `ScriptCompiler` / `CommonConfig` 三个重灾区的行为有测试兜底
  （现状：`editorRS` 在测试里**没有**引用，所以这一步要先补测试，否则是**裸改**）；
- **风险**：**高**。建议单独一个阶段、单独一个 PR。

## 4. 明确不做（边界）

- **不把 Pinia 换掉**：`editorData` 的目标就是 Pinia（它已经在路上），不要为了"统一到 cordis"
  再迁一次——那会制造第二轮同样的债务；
- **不为空壳建服务**：`editorui` 是删，不是迁；
- **不在本文档阶段改任何代码**：这是评估稿，代码改动按 §3 分阶段走各自的 PR；
- **不顺手修 `<any>` 掩盖的字段缺失**（§3 第 1 步第 2 条）：那是独立的问题，值得单独开 issue。

## 5. 怎么复现这些数字

```bash
node scripts/editor-singleton-survey.mjs
```

它做三条自证（也就是"这份台账不会假绿"的原因）：

1. 清单里的定义文件都存在（防**清单过期**——文件改名后台账会指向不存在的东西）；
2. 每个单例都扫到了外部引用（防**扫描器坏了**——一个都没扫到时"引用面归零"会假绿）；
3. 定义文件里真的看得到它的导出（防把空文件/改名文件当单例）。

## 6. 脚本的局限（别把台账当全知）

- **"模块顶层使用"是启发式**（顶格且不是 import/export/注释），不是 AST 判定。
  它只用来**指路**（哪几个文件值得人看一眼），**不是判据**——真要守住"模块顶层不许有副作用"，
  执行者是 `scripts/check-module-side-effects.mjs --strict`（那是 AST 的）；
- **只统计 `packages/editor`**：这四个单例都是编辑器全局，宿主侧不引用它们
  （宿主是独立进程，`bin/**` 不 import `src/**`——这条由 `check-editor-host.mjs` 的依赖方向判据守着）；
- **匹配是文本级**：`editorData` 出现在字符串/注释里也会被算作一次引用。
  台账因此是"引用面的**上界**"——这方向是安全的（它只会让人**高估**工作量，不会漏掉消费方）；
- **反向校验（"迁完的不许复活"）用的是"被 import"口径，不是文本级**：已经删掉的东西在注释里
  被提到是**合理的**（甚至是好文档），只有**被 import 回来**才算复活。这条也是实测出来的——
  第一次跑反向校验就报"引用它的文件数=2"，而那两处都是本次删除留下的注释；
- 与之配套，`importedIn` 自己有一条**方法自证**（拿 `editorRS` 这个确定被 import 的单例当探针）：
  少了它，那个正则一旦写坏，"文件不在 + 没人 import"就会永远成立，反向校验**假绿**；
- **上限的"收紧"是人工动作**：`EDITORDATA_MAX_REFERENCES` 能防"涨回去"，但**防不住"该收紧却没收紧"**
  （迁完一批却忘了改数字——脚本看到的是"没超上限"，照样绿）。所以每批的验收里显式包含
  "**把上限改成实测值**"这一条；它是流程纪律，不是机器判据（如实记在这里，不当它已被守住）。
