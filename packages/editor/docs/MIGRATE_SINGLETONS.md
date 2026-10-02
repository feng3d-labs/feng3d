# 全局单例迁服务（#272 P5）

> 状态：**评估稿（2026-10-02）**。本文只描述现状、顺序与验收，**本阶段不含代码改动**。
>
> 台账里的每个数字都来自 `node scripts/editor-singleton-survey.mjs`——跑一遍就能复现，
> 没有一个是手数的。这条纪律是有代价换来的：写脚本时用 PowerShell 数过一次，
> 因为 `Select-String` **默认大小写不敏感**，把 `EditorRS`（类）也算成了 `editorRS`（单例），
> 于是"测试里有 6 处引用"这个**不存在的债务**差点进了台账（真实是 0 处）。

## 0. 一句话结论：`NODE_HOST.md` 的 P5 那句话需要修正

P5 原话是"`EditorData` / `editorui` / `editorRS` / `editorcache` 逐个迁为服务"。
实测下来它们**不是同一类东西**，"迁服务"对其中两个甚至不是正确的目标：

| 单例 | 外部引用 | 它**其实**是什么 | 目标应该是什么 |
|---|---|---|---|
| `editorData` | **68 处 / 21 文件** | **已经是 Pinia 的过渡层**——`@deprecated 请直接使用 useEditorStore()`，内部 getter 转发给 Pinia store | → **Pinia**（继续清消费方）。**不是** cordis |
| `editorRS` | 43 处 / 7 文件 | 页面侧资源系统实例（`extends ReadWriteRS`），并在**模块顶层**把自己挂给引擎（`ReadRS.rs = editorRS`） | → 服务（**页面侧**容器）＋ 那条顶层赋值改成**显式注入** |
| `editorcache` | 15 处 / 3 文件 | 偏好持久化（localStorage + `beforeunload`），**模块顶层 `new EditorCache()`**（R2 的既有违反项，代码注释自己承认） | → 服务或 Pinia；**第一步先消掉模块级 `new`**（零 API 变化） |
| `editorui` | 11 处 / 4 文件 | **兼容空壳**：只有 `assetview.invalidateAssettree` 有实现，其余 5 个字段（`stage` / `mainview` / `tooltipLayer` / `popupLayer` / `messageLayer`）靠 `<any>` 断言"假装存在" | → **删掉**（消费方改走 Vue 侧入口）。把它"迁成服务"等于给空壳发身份证 |

一句话：**P5 不是"四件事同一件"，而是"一件清理 + 一件去副作用 + 一件已在别的路上 + 一件真迁移"**。

## 1. 现状（实测）

```
单例            引用处数  文件数  测试引用  角色
editorData             68      21         0  编辑器状态（已经是 Pinia 的过渡层）
editorui               11       4         0  传统 UI 层留下的兼容空壳
editorRS               43       7         0  页面侧资源系统
editorcache            15       3         0  偏好持久化（模块顶层 new）
```

**爆炸半径**（每个单例引用最多的文件，也就是每步要重点改的地方）：

| 单例 | 引用最多的三个文件 |
|---|---|
| `editorData` | `shortcut/Editorshortcut.ts`(13)、`feng3d/mrsTool/MRSToolTarget.ts`(9)、`configs/CommonConfig.ts`(5) |
| `editorui` | `Editor.ts`(5)、`configs/CommonConfig.ts`(4)、`index.ts`(1) |
| `editorRS` | `ui/assets/EditorAsset.ts`(15)、`ScriptCompiler.ts`(8)、`configs/CommonConfig.ts`(7) |
| `editorcache` | `configs/CommonConfig.ts`(7)、`assets/EditorRS.ts`(4)、`Editor.ts`(4) |

`configs/CommonConfig.ts` 出现在**四个**单例的引用榜上——它是"编辑器启动装配"那一处，
四步都会碰到它；这也说明**迁移顺序里它会被反复改**，值得先把它的职责看清。

**依赖矩阵**（决定顺序）：

```
editorData    -> （无）
editorui      -> （无）
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

### 第 1 步：`editorui` 直接删（11 处 / 4 文件）

它**不是服务**，是空壳：只有 `assetview.invalidateAssettree` 转发到
`vue-app/views/ProjectViewAdapter`，其余字段没有实现。删法：

1. 把消费方对 `editorui.assetview.invalidateAssettree()` 的调用**直接换成** import 那个函数；
2. 检查有没有人读那 5 个"假装存在"的字段——**有的话说明那里正在静默地拿到 `undefined`**，
   那是另一个 bug（本文只负责把清单列出来，不顺手修）；
3. 删文件、删导出。

- **验收**：`editorui` 在普查脚本里 0 处 / 0 文件；CI 全绿。
- **风险**：低。唯一要小心的是第 2 条——`<any>` 断言会掩盖"字段其实不存在"。

### 第 2 步：`editorcache` 去模块级 `new`（15 处 / 3 文件）

`export const editorcache = new EditorCache();` 是模块顶层执行代码（R2 的既有违反项）。
这一步**不改 API**，只把它改成 lazy：

```ts
let cache: EditorCache | null = null;
export function getEditorcache(): EditorCache { return (cache ??= new EditorCache()); }
```

- **验收**：`check-module-side-effects.mjs --strict` 的存量统计里少一处**（要确认它是否已被统计——若脚本没覆盖 `.ts` 的 `new` 形态，这步顺带把它加进去）**；CI 全绿。
- **风险**：低。消费者从 `editorcache.xxx` 改成 `getEditorcache().xxx`（15 处）。
- **注意**：`beforeunload` 那段（`typeof window !== 'undefined'` 守卫）**保持原样**：
  它是"卸载前保存"，改成 lazy 之后仍然要在模块顶层注册那个监听器（否则不触发）。
  这也是本步的边界——**"显式注册监听"与"模块级副作用"是两件事**（见根 AGENTS.md §R2 的边界说明）。

### 第 3 步：`editorData` → Pinia（68 处 / 21 文件）

**这条路编辑器自己已经在走**（`EditorData` 的 JSDoc 写着 deprecated、内部转发 Pinia）。
P5 在这一步的角色不是"迁"，而是**登记进度 + 设一个可查的终点**：

- 终点判据：普查脚本里 `editorData` 的引用面归零（= 没人再 import 那个过渡层）；
- 做法：按引用榜从多到少（`Editorshortcut.ts` 13 → `MRSToolTarget.ts` 9 → …）逐个换成 `useEditorStore()`；
- **注意**：`EditorData` 里有几处**不是**纯状态转发（如 `editorData.openScript` 这类带行为的入口），
  替换时要落到对应的 store action，而不是照抄字段名。

- **验收**：引用面**单调下降**（每批一次提交，脚本读数可对照）；CI 全绿。
- **风险**：中。68 处分布广，但每处都是机械替换 + 类型检查兜底。

### 第 4 步：`editorRS` 迁服务（43 处 / 7 文件，最难）

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
  台账因此是"引用面的**上界**"——这方向是安全的（它只会让人**高估**工作量，不会漏掉消费方）。
