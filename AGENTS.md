# 开发规范（严格执行）

本文件是本项目所有开发规范的**唯一权威来源**。所有代码（含人工编写和 AI 辅助生成）都严格执行。DSH（DeepSeek Harness）会自动加载本文件作为项目指令。开发工具链统一为 DSH，**不再使用其他 AI 工具专属的配置文件**，规范一律写在本文件或子包的同名文件中。

---

## 1. 改代码后必须检查运行日志
- 路径：`examples/logs/frontend_*.log`（按时间排序，取最新的）
- 上下文压缩后也不能忘记
- 有报错必须修复后才能结束

## 2. 纯数据声明式风格
- 场景用单个 Object3D 字面量定义（参照 `examples/src/base/Container3DTest.ts`）
- 不使用 `new`、`createXxx()` 命令式 API
- 纯数据接口 + `__type__` 字面量

## 3. Logic 类化
- 所有 XxxLogic 是 class（不是 interface+工厂）
- protected constructor（只有 logic() 能创建；`logic.ts` 用 `new factory(data)` 统一调用，class 与存量工厂函数在分发边界兼容）
- ComponentLogic.entity / .component 是 getter（只读）
- init() 接收可选 object3D 参数，子类 override 需调 super.init(object3D)
- **新写 Logic 一律 class**（存量工厂函数在被触碰时转换，不做一次性重写）。模板：

```ts
export class RotateLogic extends ScriptLogic
{
    #data: Rotate;                       // 私有状态用 #field（不用闭包）

    protected constructor(data: Rotate)
    {
        super(data);
        this.#data = data;
    }

    update(interval: number): void { /* 行为；只读 getter/computed 对外 */ }
}
registerLogic('Rotate', RotateLogic);
```

- 继承表达 is-a（如 ScriptLogic → BehaviourLogic 层级），组合表达 has-a（持有基类实例字段）
- 方法在原型上共享（千级对象场景避免每实例闭包）

## 4. 文件组织
- 纯数据接口与 Logic 合并到同一文件（如 Behaviour.ts 包含 interface Behaviour + class BehaviourLogic）
- import 用 `logic` 函数（不用 `componentLogic`），局部变量冲突时用 `getLogic` 别名
- 避免默认导出、避免不必要的导出
- 避免动态 `import('./x').Type`，改用顶部 `import type { Type } from './x'`

## 5. 命名规范
- 类：PascalCase
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE
- 响应式代理变量：`r_` 前缀（详见第 8 章）

## 6. 代码风格（由工具强制，勿手改）
- 4 空格缩进、LF 换行、UTF-8
- 大括号 Allman 风格（左大括号换行）
- 语句必须以分号结尾（根 eslint `semi: error`）
- 单引号、多行尾随逗号
- 由 `.editorconfig` + `.vscode/settings.json` + 各 `eslint.config.js` 执行
- 注释用简体中文，公共 API 必须有 JSDoc

## 7. 仓库形态（单仓多包）

- **当前形态**：`packages/` 下 **20 个包**（`packages/*` 下每个目录都有 `package.json`）**由主仓直接追踪**（普通目录，非 submodule），改动直接在主仓提交
- 仓库当前**不含任何 submodule**：原先作为外部参考源码的 `references/three.js` 已整体移除（它不参与构建与发布，移除不影响功能）。需要对照 three.js 实现时请从上游自行获取，不要再假设仓库内存在该目录
- **历史**：`bb19b24f` 曾把 23 个包迁移为 git submodule（多仓联邦），因「主仓每次重构都要手动逐个同步 submodule 指针」的摩擦成本过高，于 `18ef3a29` 全部转回主仓源码。**不要再按 submodule 流程操作 `packages/`**
- **配套仓库**：`@feng3d/tsl` 仍在**外仓**（本仓 `packages/` 下没有 `tsl`），若要长期保持外仓必须建立版本对齐契约（见 `docs/ARCHITECTURE_V2.md` §5.2）。`@feng3d/editor` **已收回主仓**——代码就在 `packages/editor`（主仓追踪 **735 个文件**），是 **workspace 成员**（根 `workspaces` 的 `packages/*`），依赖写的是 `feng3d: "*"`，**不再是"独立在外仓、与主仓 API 失联"**；CI 有 `editor:` job（`npm run lint --workspace feng3d-editor` + `scripts/check-editor-types.mjs` 分类门禁）与 `editor-e2e:` job（浏览器端到端）。编辑器自身的形态、分期与结论见 [packages/editor/docs/ARCHITECTURE.md](packages/editor/docs/ARCHITECTURE.md)（§4 分层 / §8 P4 / §6 / §10）

## 8. 响应式对象使用规范（核心，由 eslint-plugin-feng3d 强制执行）

> 执行机制：根 `eslint.config.js` 启用 3 条自定义规则（源码 error、测试文件 off）：
> - `feng3d/reactive-naming`：`const x = reactive(...)` 的变量名必须 `r_` 前缀（可自动 fix）
> - `feng3d/no-reactive-export`：禁止导出响应式对象
> - `feng3d/no-reactive-argument`：禁止把响应式对象作为函数参数传递

### 8.1 核心原则
- 库默认不支持改变数据，仅支持读取；修改数据通过 `reactive()`/`computed()`/`effect()` 进行
- 响应式对象**始终仅存在于函数或闭包内**，不得作为属性存储、导出、或作为函数参数传递

### 8.2 不返回响应式对象
- 函数返回值、对象字段都返回/保存**原始对象（raw）**
- 仅在需要建立响应式依赖的闭包内用 `reactive()` 转换为代理
- `reactive()` 通过 WeakMap 缓存：多次调用 `reactive(obj)` 返回同一代理，无额外开销

### 8.3 响应式代理用 `r_` 前缀
- 持有响应式代理的变量/字段必须以 `r_` 开头（如 `r_stats`、`r_buffer`、`r_entity`）
- 原始对象不加前缀

### 8.4 写响应式数据：避免「读响应式再写回」
- ❌ `r_counter.x++`（读取响应式字段会建立依赖）
- ✅ 从原始对象读取当前值、向响应式代理赋值新值：
  ```ts
  const counter = stats[key];           // 原始子对象，读不建依赖
  const r_counter = reactive(counter);  // 响应式代理（r_ 前缀）
  r_counter.x = counter.x + 1;
  ```

### 8.5 所有响应式属性都应该是 `readonly`
- 纯数据接口中会被响应式系统追踪的字段，类型上一律 `readonly`
- 防止外部直接赋值破坏内部不变量；写入只通过专门函数/方法经响应式代理进行
- 数据类的基础属性默认 `readonly`，数据修改通过响应式系统进行

### 8.6 传参用原始对象
- 传给其他函数时用原始对象，不用响应式代理
- 从原始对象属性获取，或用 `toRaw()` 从响应式对象还原：
  ```ts
  // ✓
  entityLogic(entity.parent);
  entityLogic(toRaw(r_entity.parent));
  // ✗
  entityLogic(r_entity.parent);
  ```

### 8.7 reactivity 库 API 边界
- API 与 `@vue/reactivity` 保持一致
- **不支持**：markRaw / shallowRef / shallowReactive / shallowReadonly / readonly / computed setter / `__v_skip`
- 扩展规则：只有 `Object.isExtensible` 不通过的对象才不响应化（Float32Array 等可响应化）

## 9. WGSL 着色器
- WGSL 着色器从原始 GLSL（保留在 `packages/feng3d/src/shaders/*.glsl` 和 `packages/feng3d/src/shaders/modules/*.glsl`）翻译而来
- 修改时对照对应 GLSL 文件，保持语义一致
- 着色器以内联 TypeScript 字符串形式存在（`*.wgsl.ts` 导出字符串常量），不用 .wgsl 文件
- WGSL 与 GLSL 差异注意：
  - 不支持 swizzle 赋值
  - `textureSample` 需均匀控制流（非均匀流用 `textureSampleLevel`）
  - `@group/@binding` 在 vertex/fragment 间同名槽位必须一致

## 10. WebGPU readonly 边界
- WebGPU API 要求数组可变，但库使用 readonly 数组
- 在与 WebGPU API 交互的边界处，用 `TypeConvert.ts` 工具函数转换
- **不要简单地移除 readonly 修饰符**

## 11. 纯数据接口与 Logic 分层（核心）

> 适用所有「纯数据接口 + Logic 工厂」组合（Geometry/GeometryLogic、Object3D/Object3DLogic、Material/MaterialLogic 等）。

### 11.1 数据与行为分离
- **纯数据接口**（`interface XxxGeometry` 等）：只声明 `readonly` 字段（含 `__type__` 字面量、构造参数、可响应式追踪的数据字段），不含方法
- **Logic**（`xxxLogic()` 工厂返回的实例）：提供行为（getter/computed/方法），**对外只读**
- 数据放在接口、行为放在 Logic，二者一一对应、合并到同一文件（符合第 4 章）

### 11.2 Logic 对外全部只读
- Logic 实例上的所有字段（含顶点数据、矩阵、状态等）一律 `readonly` getter，**不暴露 setter、不暴露可写字段**
- 需要修改时，改的是**纯数据接口的字段**（经响应式代理），不是 Logic
- Logic 只暴露方法（`clone()/raycast()/beforeRender()` 等）和 `setAttributes()` 这类配置方法；像 `setAttr()` 这类内部辅助方法不进公开接口

### 11.3 修改走纯数据接口（响应式）
- 修改数据通过 `reactive(data).field = value` 写入**原始数据对象**，不操作 Logic 实例
- Logic 用 `computed` 桥接数据接口字段：getter 内 `reactive(data).field` 读取，字段变化时 computed 自动失效
- 示例：
  ```ts
  // ✓ 写入纯数据接口字段
  reactive(data).field = value;
  // ✗ 直接写 Logic（字段只读，赋值报错）
  logicInstance.field = value;
  ```
- 涉及 TypedArray / WebGPU 原生 API 的边界转换细节（如 reactive 代理数组需先 `toRaw` 还原），写在各具体实现文件的注释里，不进本通用规范

### 11.4 基接口不直接构造
- 抽象基接口（如 `Geometry`）**不声明 `__type__`**，不应直接构造 `{ __type__: 'Geometry' }`
- 只构造具体子接口（`CubeGeometry`/`PlaneGeometry` 等），它们各自声明 `readonly __type__: '<字面量>'`
- 联合类型用具体子类型联合（`Geometrys = GeometryMap[keyof GeometryMap]`），不带基接口兜底
- 按基类型分发的位置（`clone()`/`getDefaultGeometry()` 等）入参/返回值用具体子类型联合

### 11.5 子接口字段可选，工厂补默认
- 具体子接口的构造参数字段（尺寸/分段数/开关等）一律声明为**可选** `readonly field?: T`
- 默认值由 Logic 工厂顶部统一填充（`if (data.field === undefined) writable.field = <默认>`，经 `UnReadonly<T>` 断言写入）
- 这样字面量声明可省略任意字段，由工厂补全；类型声明与实现保持一致（避免「类型必填、实现按可选处理」的矛盾）

### 11.6 数组字段：属性与数组都只读（issue #605 定口径）

> **读侧纯数据接口的数组字段一律 `readonly T[]`**——属性 `readonly`、数组本身也 `readonly`。
> 执行者：`scripts/check-readonly-array-fields.mjs`（新增即失败，存量冻结在
> `scripts/readonly-array-fields-baseline.json`；本地等价命令 `node scripts/check-readonly-array-fields.mjs`，
> 随 `prelint:ci` 进 CI）。存量清单与分批策略见 [docs/READONLY_SHAPES_MIGRATION.md](docs/READONLY_SHAPES_MIGRATION.md)。

- **适用对象**（两类，都可机械判定）：名字以 `Like` 结尾且不以 `Writable` 开头的接口；声明了 `__type__` 属性的纯数据接口
- 正例 / 反例：
  ```ts
  // ✓ 属性与数组都只读
  export interface FrustumLike { readonly planes: readonly PlaneLike[]; }
  // ✗ 属性只读、数组可变：读侧形状上能 push / splice / sort，写入口开在读侧
  export interface GradientLike { readonly alphaKeys: GradientAlphaKey[]; }
  // ✗ 属性也可变：§11.1 要求纯数据接口只声明 readonly 字段
  export interface FooLike { items: Item[]; }
  ```
- **要就地改数组，改「可写形状」（§11.3），不改读侧类型**：
  ```ts
  export interface WritableGradientLike { alphaKeys: GradientAlphaKey[]; }
  // 装配点：const r_data = reactive(data) as WritableGradientLike;
  ```
  注意 `sort()` 在只读数组类型上**不存在**：必须「取出 → 排序 → 经可写形状整体赋回」或整体替换
- **不适用 / 排除项**：`Writable*` 形状（它们就是写侧）；WebGPU 边界（第 10 章）——
  `Matrix4x4.elements`、`RenderPassDescriptor.colorAttachments` 等**不要靠删 `readonly` 修**，
  按第 10 章用 `TypeConvert.ts` 转换，它们冻结在基线里；非纯数据接口（WebGPU 描述符、
  编辑器 UI 类型、GLTF 解析中间类型）**不参与判据**，只统计（否则会天天误报）
- **已知局限**（有意不查，见脚本注释）：类型别名里的数组、class 字段、type 字面量、
  嵌套数组的**内层**（纵深 1 层）、索引签名

## 12. 提交规范
- 使用约定式提交（Conventional Commits），**简体中文描述**：
  ```
  <类型>(<范围>): <简短描述>
  ```
- 类型：`feat` / `fix` / `refactor` / `perf` / `style` / `docs` / `test` / `chore` / `build` / `ci`
- 范围可选（如 `webgpu`、`render`、`shadow`）
- 第一行 ≤50 字符，祈使句（"添加"/"修复"/"优化"）
- 每个 commit 只做一件事
- 提交不含截图、日志文件等临时文件
- submodule 改动：仓库已无 submodule（`references/three.js` 已移除）；若确需新增 submodule，先在本文件第 7 章登记其用途与「是否参与构建」

## 13. 测试
- 测试框架：Vitest
- 新功能必加测试，修 bug 加回归测试，改公共 API 必更新测试
- **覆盖率由门禁守着**（issue #74）：`npm run test:coverage`（= `vitest run --coverage`）在跑完同一批测试后校验阈值，低于阈值即失败。阈值取「实测基线向下留余量」——作用是**防下降**，不是宣告达标；各包现状分档与冲击 80% 的路径见 [docs/CI.md](docs/CI.md) §1.3。上调阈值时同步更新该表。**读数本身可能虚高**（issue #645）：只被间接 `import`、自身一行都没执行的模块会被整份算成 100%，故 `test:coverage` 末尾追加 `node scripts/check-coverage-inflation.mjs`（新增虚高文件即失败，基线 `scripts/coverage-inflation-baseline.json`；判据与残留面见该脚本文件头）
- **升级测试基础设施（vitest / coverage provider）后必须按新口径重测阈值**，不能沿用旧值：vitest 3.2.6 → 5.0.2 时同一份代码的语句总数从 56571 变 30142、分支分母从 4366 变 12996（插桩与 sourcemap 映射方式变了），旧阈值会让门禁立刻全红

## 14. 其他约定
- 截图（Playwright MCP 等）放 `.playwright-mcp/` 目录，不入根目录
- **资源文件后缀**（issue #40）：保留原后缀并在前面加类型标记，让编辑器与工具能靠后缀识别资源类型——
  `f.scene.json`（含 Scene 组件的场景）、`f.gameobject.json`（对象）、`f.material.json`、`f.geometry.json`、
  `f.anim.json`、`f.texture.json`、`f.texturecube.json`、`f.script.ts`、`f.shader.ts`。
  由 `test/resourceFormatGuard.spec.ts` **反向**守住：内容既然是某类资源，后缀就必须带上对应标记；
  资源目录里的配置类 json（JSONC，带注释）不受此约束
- 子包采用源码发布策略，不构建 dist
- `npm`：`save-exact`、`save-dev`、`audit-level=moderate`（见 `.npmrc`）
- 文档同步：增删改 API/类型/架构时同步对应 `docs/`
- 文档相对链接必须有效：移动/重命名文件或归档文档后，正文里的旧路径不会报错、不会让测试失败，
  只有读者点进去 404 才发现。本地跑 `node scripts/check-docs-links.mjs`（已进 CI 门禁）；
  只查仓库内相对链接，`http(s)` 外链与页内锚点不查（外链有效性受网络与对方站点影响）

## 15. 架构执行规范（R1–R12）

> **元规则**：每条规范必须有**机器执行者**（linter / 类型检查 / CI 门禁）。无执行者的只能写进「建议」，不算规范。
> 规范与实现冲突时，必须改文档或改代码，不允许长期并存。
> 完整 12 条与落地计划见 [docs/ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) §3。

以下四条为展开条文的核心规范（执行者均已落地）：

| 编号 | 规范 | 执行者（现状） |
|---|---|---|
| **R1** | **依赖方向只向下**：只允许上层依赖下层，同层之间不得互相依赖（分层见 ARCHITECTURE_V2 §2.1） | ✅ `scripts/check-layer-direction.mjs`（按包级依赖检查，存量 5 条向上依赖冻结在基线、新增即失败）+ `scripts/check-layer-deps.mjs`（地基白名单 / 无环）。~~`eslint import/no-restricted-paths`~~：`eslint-plugin-import` 在本仓 flat config + 新版 eslint 下装不上（ERESOLVE），改用等效脚本 |
| **R2** | **零模块级副作用**：模块不得在 import 时执行代码——禁止模块级 `new Map()` / `new WeakMap()` / `new Set()` / `new WeakSet()`（**泛型实参不影响判定**）、`register*()` 调用、`globalThis` 写入；缓存一律 lazy-init（`let cache = null; function getCache()`）。**其余**模块级 `new`（`export const x = new X()` 声明形式，含 `new Set([...])` 只读常量集合、**单个示例页的 `new GUI(...)`**、库代码单例）按存量基线冻结（`scripts/toplevel-new-baseline.json`），只允许减少。判据是 AST（覆盖类 `static` 字段 / 块、顶层 IIFE、多行声明、模块级块 / 对象字面量 / 回调），**应用入口按 `ENTRY_FILES` 清单整类豁免**（清单只含 3 个应用入口，逐条写明理由） | ✅ 四层：自研规则 `feng3d/no-module-side-effect`（源码 error / 测试 off）+ CI 脚本 `check-module-side-effects.mjs --strict`（缓存创建 / 启动型调用 / `globalThis` 写入，**新增即失败**）+ CI 脚本 `check-toplevel-new.mjs`（其余模块级 `new`，**基线冻结、新增即失败**）+ 产物级 `check-tree-shaking.mjs`。前两条共用 AST 判据层 `scripts/r2-module-scope.mjs` |
| **R3** | **纯数据声明式**：数据类（Geometry / Color / Material 等）一律用 `__type__` 字面量声明，禁止 `new` 构造（与第 2 章一致，此处补执行者） | ✅ `scripts/check-imperative-construction.mjs`（**基线 `entries` 已为空**——0 处存量、新增即失败）。~~自研规则 `feng3d/no-imperative-construction`~~：该规则一直**不存在**（issue #353 实测），改用等效脚本；名单取自 `gen-objectview-schema.mjs` 的产物（现 **84** 个纯数据类；issue #134 收尾批把 `Gradient` / `MinMaxGradient` 迁为纯数据接口后 82 → 84）。**原「排除 `@feng3d/math` 的同名 class 与 `packages/math` 包内」两处豁免已在 issue #134 阶段 C 收尾收回**（math 的 19 个数值 / 几何 class 已全部删除，豁免再无对象），基线按实测从 13 处收紧到 1 处；R3 收尾把最后 1 处（cornell）判定为「本地 class 与纯数据类同名」的假阳性、用重命名消除，基线清零 |
| **R6** | **可空性显式**：`logic()` 返回 `Logic \| null`，调用方必须显式处理；`strictNullChecks` 已在**全部 20 个包**开启（18 个直接用各自 `tsconfig.json`，`feng3d` / `editor` 走独立 `tsconfig.strict.json`） | ✅ 三层：`scripts/check-strict-dirs.mjs`（feng3d 与 editor 全部 src 必须 0 错误）+ `scripts/check-strict-packages.mjs`（包级清单双向校验：漏登记与误关闭都失败，清单 `scripts/strict-packages.json`）+ `npm run types:packages`（各包开的必须真的编译得过） |

**R1–R12 全表状态**（其余 8 条不在本节复述，以免两处各写一份而不同步；**唯一权威为 [docs/ARCHITECTURE_V2.md](docs/ARCHITECTURE_V2.md) §3.1 现状表**，下表只给一句话状态与执行者，抽查以 §3.1 为准）：

| 编号 | 规范 | 状态与执行者（详见 ARCHITECTURE_V2 §3.1） |
|---|---|---|
| R1 | 依赖方向只向下 | ✅ `check-layer-direction.mjs` + `check-layer-deps.mjs`（均进 CI） |
| R2 | 零模块级副作用 | ✅ 规则 + `check-module-side-effects.mjs --strict`（缓存 / 启动型调用 / `globalThis`，新增即失败）+ `check-toplevel-new.mjs`（其余模块级 `new`，基线冻结）+ `check-tree-shaking.mjs`（产物级）——均进 CI；前两条的判据是**同一份 AST 实现** `scripts/r2-module-scope.mjs`（#614） |
| R3 | 纯数据声明式 | ✅ `check-imperative-construction.mjs`（进 CI，**基线已归零 / 0 处存量**；math 两处豁免已随阶段 C 收尾收回） |
| R4 | 响应式纪律 | 🔶 4 条规则在跑（随 lint 进 CI），但 `toReactive` / `logic()` 代理不被识别、`this.effect(` 不受检——**仍是真缺口** |
| R5 | effect 必须注解 | ✅ `check-effect-inventory.mjs`（进 CI；实测 55 处 / 32 文件） |
| R6 | 可空性显式 | ✅ `check-strict-dirs.mjs` + `check-strict-packages.mjs` + `types:packages`（均进 CI） |
| R7 | 作用域守卫异常安全 | 🔶 机制已有（`batchRun` / `noMutationCount` 均 `try/finally` + API 级回归），但 11 个生产调用点没有逐个异常用例，**无执行者** |
| R8 | 视觉回归强度 | 🔶 容差真实存在（`playwright.config.ts` 全局 0.01；`e2e/examples.config.ts` 26 处放宽、最宽 0.4），但 examples 视觉回归**未进 CI**，"放宽需说明理由"无执行者 |
| R9 | 包体天花板 | ✅ `check-bundle-size.mjs` + `scripts/bundle-size-baseline.json`（进 CI） |
| R10 | 覆盖率门禁 | ✅ `vitest.config.ts` `coverage.thresholds`（54/44/51/54，2026-10-02 按实测复测上调）+ `npm run test:coverage`（进 CI；末尾追加 `check-coverage-inflation.mjs` 拦新增的覆盖率虚高文件，issue #645） |
| R11 | 文档现状标签 | ✅ `check-doc-status-labels.mjs`（进 CI） |
| R12 | 提交规范 | ✅ 约定式提交 + PR 评审（**无机器门禁**，有意为之） |

**当前已知违反项**（实测基线，见 ARCHITECTURE_V2 **§3.1 现状表**的「问题 / 缺口」列——R2 / R3 / R6 的违反项与存量都在那里；
R1 的分层依据另见 **§2.1 分层蓝图**，该节只含依赖方向一项）：

| 规范 | 违反位置 |
|---|---|
| R1 | ✅ **已修**（#87）：`@feng3d/math` 不再依赖 `@feng3d/objectview`（`@oav()` 注解冗余——字段描述由 `scripts/gen-objectview-schema.mjs` 从类型生成），并由 `scripts/check-layer-deps.mjs` 冻结依赖白名单。✅ **已修**（#86）：`feng3d` 不再依赖 `@feng3d/particlesystem` / `@feng3d/terrain`（改为上层扩展单向依赖 feng3d），并把它们的类型显式纳入 schema 生成器扫描。**存量**：`feng3d/src/index.ts` 聚合桶 `export *` 掩盖真实依赖 |
| R2 | ✅ **已进 CI 门禁（两条脚本，职责互补，issue #606 明确；判据 AST 化见 issue #614）**：① `node scripts/check-module-side-effects.mjs --strict`（ci.yml:76）——**import 时执行**的缓存创建（`new Map/WeakMap/Set/WeakSet()`，**泛型实参不影响判定**）、启动型调用（定时器 / rAF / ticker 启动）、`globalThis` 写入一律拦下；② `node scripts/check-toplevel-new.mjs`（ci.yml:131）——**其余**模块级 `new`（`export const x = new X()` 这类声明形式，含 `new Set([...])` 常量集合 / 库代码单例）按「文件::构造器」存量冻结在 `scripts/toplevel-new-baseline.json`（现 **95** 个组合；#614 的空参缓存欠账清掉 7 个键、#624 批次清掉 terrain 的 1 个键、ChainMap 批再清掉 29 个键），**新增即失败**、减少只提示。两条判据现在是**同一份 AST 实现**（`scripts/r2-module-scope.mjs`），覆盖类 `static` 字段 / `static` 块、顶层 IIFE、多行声明、模块级块 / 对象字面量 / 回调——原先的「行首无空白 = 模块顶层」行级判据实测漏掉 62 处（#614）。重叠处**有意重复报告**（去重比漏网好，避免"我以为你管了"）。**应用入口按路径整类豁免**，清单集中在 `r2-module-scope.mjs` 的 `ENTRY_FILES`（两条脚本共用）：入口页 import 即执行是固有语义，**真副作用因此有意放行**（实测一处 `vue-app/main.ts:93` 的模块级 `setTimeout`），风险边界与收紧路径见 `docs/CI.md` §2.1。全仓 19 处模块级缓存已 lazy-init、`Ticker` 启动改惰性（#88），三处模块级 `new WeakSet()`（`Entity` / `WGPUBindGroupEntry` / `generate-mipmap`）已在 #606 改为 lazy-init；顶层 `registerLogic` / `setAssetTypeClass` 注册（65 处）属注册模型改造，`check-module-side-effects` 只统计 |
| R3 | ✅ **已进 CI 门禁**：`node scripts/check-imperative-construction.mjs`（**基线 `entries` 已为空**——0 处存量、新增即失败）。**issue #134 阶段 C 收尾已收回两处 math 豁免**——脚本原先整包跳过 `packages/math`、并把 `@feng3d/math` 当作「同名 class 的合法提供方」；math 的 19 个数值 / 几何 class 删完后这两处再无对象，属纯死代码（留着会把 `new Vector3()` 这类真违规放过去）。同批按实测把基线从 13 处收紧到 1 处：旧基线里 `examples/src` 的 12 处在 HEAD 上早已不存在。最后 1 处 `packages/webgpu/examples/src/webgpu/cornell/index.ts::Scene` 经核实**不是**真违规：它是示例**本地 class**（`import Scene from './scene'`，目标是同目录 `scene.ts` 的 `export default class Scene`，constructor 里构建顶点 / 索引 / quad 数据、无 `__type__`），而门禁判据是「名字有导入 + 名字在纯数据类名单里」、**不看导入来源**，因此误报——已重命名 `Scene` → `CornellScene` 消除同名歧义，判据与严格性未动。`addons` 与 `editor` 的**可执行代码是 0 处**——issue #353 正文统计的 36 处把注释里的旧写法示例（`editor` 22 处、`examples` 1 处）也算进去了，本门禁只统计可执行代码（核对了每一处）。**已知局限**：判据不看导入来源，任何「本地类型与纯数据类同名」的位置都会被误报，更精确的判据需单开 issue |
| R6 | ✅ **20/20 个包已清零**。两条路线并存：① `feng3d` 与 `editor` 走**独立 strict 配置**（`packages/{feng3d,editor}/tsconfig.strict.json`）+ `scripts/check-strict-dirs.mjs`（这两个包的 `tsconfig.json` 一开 strict，TS 就会连带用它们的检查上下文去看依赖包源码并报出并不属于本包的问题）；② 其余 18 个包直接开各自的 `tsconfig.json`。清单在 `scripts/strict-packages.json`（`packages` + `exempted`），由 `scripts/check-strict-packages.mjs` 双向守住（漏登记与误关闭都失败）——**"开到哪一步"以该脚本输出为准，本表不写死数字**。**存量**：① `feng3d` / `editor` 的 `tsconfig.json` **自身**仍关 4 项（走独立配置）；② `logic()` 声明非空却返回 `null` 未动 |

---

## 16. CI 与发布（完整说明见 [docs/CI.md](docs/CI.md)）

- **CI 门禁**（`.github/workflows/ci.yml`）：推送到任意分支 / PR 触发。跑 eslint 零警告（覆盖 `packages/` + `scripts/` + `test/` 三块，见 issue #350）、全量单元测试 + **覆盖率门禁**（`npm run test:coverage`，阈值见 §13）、20 个包的类型检查与构建、以及**发布产物预演**（构建 + `npm pack` + 内容校验，不发布）。本地近似命令：`npm run ci`——它只覆盖 quality job 的**一部分**（`lint:ci`、`test:coverage`、`types:packages`、`build:packages`、`release:dry-run`；`prelint:ci` 还会顺带跑 `gates:host` 与 `check-math-no-class`），**不含** `lint:examples`、文档链接、R1/R2/R3/R5/R6/R9/R11 的那些独立脚本、R10 的分包覆盖率一致性、以及工作区污染检查，逐条对照见 [docs/CI.md](docs/CI.md) §2.1。
- **单元测试范围**：根 `vitest run` 一次跑完 `packages/feng3d/src/**/*.spec.ts`、`packages/*/test/**/*.spec.ts` 与仓库根 `test/**/*.spec.ts`。shortcut / terrain 所需的浏览器与 WebGPU 全局由 `vitest.setup.ts` 补齐，**已纳入覆盖**，不要再把它们写回 `exclude`。
- **发布**（`.github/workflows/release.yml`）：推 tag 即发布，如 `git tag v0.6.1 && git push origin v0.6.1`，会把全部 20 个公共子包（含 `feng3d-editor`）发布到 npm 并创建 GitHub Release。
- **版本语义**：tag 版本是目标版本，默认**只升不降**且**版本已存在则跳过**，所以重复推同一个 tag 是幂等的。要让每个子包都发出新版本（含版本已被占用的），加 `--bump-all`。各包历史上独立发版，不强制统一版本号。
- **发布字段改动必须同步**：改子包的 `files` / `main` / `module` / `types` / `bin` 时，跑一次 `npm run release:dry-run -- --force` 确认打包内容校验通过——该步骤会把「入口指向的文件没打进 tarball」直接拦下来；**「运行时才取的仓库内路径没被 `files` 覆盖」也由它拦下**（#277 任务 3：判定与 `scripts/check-editor-publish-files.mjs` 共用同一份实现，`scripts/release-utils/publish-files.mjs` —— "本地正常、发布版 404"就是这一类）。
- **本地预演**：`npm run release:dry-run -- --force`（安全，不调用 npm publish）。

---

## 17. 编辑器 AI 桥接（要动编辑器场景时先看这里）

`packages/editor` 内置一条 **AI 桥接通道**：AI 可以用语义化方法直接查询与操作编辑器场景，
不必靠 DOM 选择器模拟点击，也不必把整个场景 JSON 塞进上下文。仓库里配合编辑器工作时优先走它。

- **文档**：[docs/EDITOR_AI_BRIDGE.md](docs/EDITOR_AI_BRIDGE.md)——协议、方法表、**§13 AI 工作流建议**、已知限制
- **DSH 里的工具名**：`mcp__feng3d-editor__*`（如 `scene_add`、`scene_batch`、`view_probe`、`camera_focus`）
- **前提**：dev server 在跑，且编辑器页面已在浏览器中打开；写能力**默认开启**，可在「设置 → AI 桥接」里关掉
- **自检**：`node scripts/editor-bridge-smoke.mjs`（冒烟）、`editor-bridge-fuzz.mjs`（非法/边界输入）、
  `editor-mcp-check.mjs`（MCP 工具表 ↔ 桥接方法表一致性，离线可跑）、`npm run test`（单元测试）
- **两条要点**：**改完场景必须看画面**——`view.probe` 几百字节就能判出"纯色 / 全黑 / 只有背景"，
  确认有变化再取图；**成组操作走 `scene.batch`**——中途失败自动回滚，不留半成品
