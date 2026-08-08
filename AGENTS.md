# 开发规范（严格执行）

本文件是本项目所有开发规范的**唯一权威来源**。所有代码（含人工编写和 AI 辅助生成）都严格执行。ZCode 会自动加载本文件作为项目指令。

> 本文件合并了原 `CLAUDE.md`、`packages/webgpu/CLAUDE.md`、`.cursorrules` 中的规范。子包的 CLAUDE.md / .cursorrules 仅保留与本包特定 API 相关的说明，通用规范一律以本文件为准。

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
- protected constructor（只有 logic() 能创建）
- ComponentLogic.entity / .component 是 getter（只读）
- init() 接收可选 object3D 参数，子类 override 需调 super.init(object3D)

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

## 7. 子模块
- `packages/` 下是独立 git 仓库（submodule），改动需在该子仓库内单独 commit
- 共 23 个 submodule（见 `.gitmodules`），含 reactivity/webgpu/math/rendering/eslint-plugin-feng3d 等
- 主仓库需额外提交一次 submodule 指针更新：`git add packages/xxx && git commit`

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
- submodule 改动：先在子仓库 commit，再在主仓库 commit 指针更新

## 13. 测试
- 测试框架：Vitest
- 新功能必加测试，修 bug 加回归测试，改公共 API 必更新测试
- 覆盖率建议 >80%

## 14. 其他约定
- 截图（Playwright MCP 等）放 `.playwright-mcp/` 目录，不入根目录
- 子包采用源码发布策略，不构建 dist
- `npm`：`save-exact`、`save-dev`、`audit-level=moderate`（见 `.npmrc`）
- 文档同步：增删改 API/类型/架构时同步对应 `docs/`
