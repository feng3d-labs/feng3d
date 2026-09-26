# 属性面板的字段与分组配置

编辑器属性面板的字段来自**两层**，都按 `__type__` 查（不再需要装饰器）：

| 层 | 文件 | 管什么 | 谁维护 |
|---|---|---|---|
| **描述表** | `generated/dataTypeSchema.ts`（**生成**，勿手改） | 有哪些字段、各用什么控件 | `scripts/gen-objectview-schema.mjs` 从 TypeScript 类型推出 |
| **配置** | `src/configs/objectViewSchema.ts`（手写） | 分组、显示名、取值范围、对象级视图、字段增删 | 人 |

查询时二者合并，**配置优先**。描述表里没有的 `__type__` 也可以纯靠配置定义字段。

---

## 描述表：字段清单与控件种类怎么来的

```bash
node scripts/gen-objectview-schema.mjs          # 生成/更新产物
node scripts/gen-objectview-schema.mjs --check  # 校验产物是否为最新（CI 门禁）
node scripts/gen-objectview-schema.mjs --stats  # 只看统计
```

判据是**接口自己声明的** `readonly __type__: '<字面量>'`：

```ts
export interface MeshRenderer extends Renderable
{
    readonly __type__: 'MeshRenderer';
    readonly geometry?: Geometrys;
    readonly material?: Materials;
    readonly castShadows?: boolean;
}
```

新增组件只要按范式写接口，重跑生成器（或让 CI 的 `--check` 提示你跑），面板就跟着更新——
**不需要改面板代码，也不需要装饰器**。

为什么非得从类型里拿：纯数据对象上只有**用户显式写过的**字段。`{ __type__: 'PerspectiveCamera' }`
的 `Object.keys` 就只有一个 `__type__`，`logic()` 前后字段完全一致（工厂不补默认值），
Logic 的 getter 又全是计算型的（`projectionMatrix` 那类）。字段清单只存在于 TypeScript 类型里，
而 interface 编译后完全消失。

### 类型 → 控件的推断规则

| 类型形态 | 控件 |
|---|---|
| `number` / `boolean` / `string` | `number` / `Boolean` / `String` |
| `{ x, y }` / `{ x, y, z }` / `{ x, y, z, w }` | `Vector2` / `Vector3` / `Vector4` |
| `{ r, g, b }` / `{ r, g, b, a }` | `Color3` / `Color4` |
| `T[]` / `Array<T>` | `Array`（元素类型另记 `itemControl`） |
| `Components[]` | `Components`（按组件逐个渲染属性视图） |
| 字符串字面量联合 | `Enum`（候选值 = 各字面量） |
| TS enum，成员值**连续**（`0,1,2…`） | `Enum`（`numericValues` 给 名字→数值，可编辑） |
| TS enum，成员值**不连续**（`1,2,255`） | `Enum` + `numeric` → **只读**（位标志，用下拉单选表达是错的） |
| 各成员都带 `__type__` 的对象联合 | `Object`（`typeNames` 给候选类型名） |
| 其它对象 | `Object` |
| 认不出来 | `Default` |

> 判据全部走**类型标志**（`TypeFlags`）而不是 `typeToString` 的字符串比较：`boolean` 在 TS 里是
> `true | false` 的联合、可选性在**符号标志**上而不在类型里，字符串比较会把布尔字段判错。

---

## 配置：分组、显示名、范围、视图

```ts
// src/configs/objectViewSchema.ts
export const OBJECT_VIEW_CONFIG: ObjectViewConfigMap = {
    MeshRenderer: {
        // 分组与顺序（面板上的分节标题）
        blocks: [{ name: '几何' }, { name: '材质' }, { name: '渲染' }, { name: '行为' }],

        attributes: {
            geometry: { label: '几何', block: '几何' },
            material: { label: '材质', block: '材质' },
            castShadows: { label: '投射阴影', block: '渲染' },
            // 取值范围 / 步长交给控件
            intensity: { label: '强度', block: '渲染', componentParam: { minValue: 0, step: 0.1 } },
            // 追加描述表里没有的字段（面板上的动作按钮之类）
            refresh: { label: '刷新', block: '行为', component: 'OAVFunction' },
            // 不想显示的字段
            lightType: { exclude: true },
        },
    },
};
```

### 可配的字段项

| 键 | 说明 |
|---|---|
| `label` | 面板上的显示名（缺省由控件用字段名推导：`castShadows` → `Cast Shadows`） |
| `block` | 所属分组名，需在 `blocks` 里声明过 |
| `priority` | 组内排序权重，数字越小越靠前（同权重保持描述表里的声明顺序） |
| `type` | 覆盖**控件种类**（走 `setDefaultTypeAttributeView` 注册表，如 `number` / `Boolean`） |
| `component` | 直接指定 OAV 控件名（`OAVNumber` 这类，绕过类型注册表） |
| `componentParam` | 控件参数（`minValue` / `maxValue` / `step` / `stepDownup`…） |
| `editable` | 是否可编辑 |
| `exclude` | 从面板排除 |
| `tooltip` | 提示信息（缺省是 TS 类型原文） |

### 对象级

| 键 | 说明 |
|---|---|
| `view` | 对象视图控件名（代替原先挂在 class 上的 `@OVComponent()`） |
| `viewParam` | 对象视图控件参数 |
| `blocks` | 分组定义与顺序；`component` / `componentParam` 可指定该节的块视图控件 |

### 分组怎么排布：块视图控件

分组不只是「分个类」，它的排布由**块视图控件**决定（`blocks[].component`，缺省 `OBVDefault`）：

| 块视图 | 排布 | 适合 |
|---|---|---|
| `OBVDefault` | 每个字段一整行；标题单独一行、**可折叠** | 参数多、一屏看不完的组（变换、材质、阴影…） |
| `OBVInline` | 字段**按最小宽度自动排布**（宽则一行多个、窄则换行），不折叠；标题占行首一窄列 | 名称 / 标签 / 启用 / 可拾取 这类短字段，一眼扫过即可 |

```ts
Object3D: {
    blocks: [
        { name: '基本信息', component: 'OBVInline' },   // ← 短字段自适应排布
        { name: '变换' },                                // ← 缺省 OBVDefault，逐行展开
        { name: '资源' },
        { name: '组件' },
    ],
    ...
}
```

`OBVInline` 的细节：每项最小宽度 88px（够放一个短字符串或一个开关），一行放不下就换行。
44px（四个硬挤一行）连 `Plane` 都显示不全，实测过。

### 面板的响应式布局

字段行的自适应规则集中在 **`src/vue-app/styles/object-view.css`**（一份全局覆盖层，
而不是散在 20 个控件的 scoped style 里）：

| 规则 | 为什么 |
|---|---|
| 值区 `min-width: 0` + 输入类控件 `width: 100%` | Element Plus 的 `el-input-number` 默认写死 120px，一行三个就是 360px——面板放不下时**既不压缩也不换行，直接把 X/Y/Z 顶出窗口**（实测 `right=1479 > 视口 1280`） |
| 标签 `max-width: min(120px, 38%)` | 原先写死 `flex: 0 0 120px`，面板 222px 时值区只剩 68px |
| 面板 ≤300px：标签移到控件上方 | 值区拿到整行宽度，X/Y/Z 才显示得全 |
| 面板 ≤360px：藏掉数字步进按钮 | 加减按钮占掉约 30px 右内边距；窄面板里数值本身比微调按钮重要 |

每条规则都带 `:root` 前缀把特异性提到 (0,3,0)：控件自己的 scoped 样式是 (0,2,0)，
不加前缀就得靠样式注入顺序决定谁生效（不可靠）。

### 悬停提示不超出窗口

字段标签原本用浏览器原生 `title`。原生提示由浏览器画在**窗口之外**（Chromium 只按屏幕边界收，
不按窗口收），而检查器面板贴着窗口右缘，于是提示会跑到窗口外。

现在由 `src/vue-app/objectview/utils/fieldTooltip.ts` 接管：渲染时就把 `title` 摘进 `data-tip`
（原生提示永不出现），悬停时用一个固定在文档里的提示元素，**定位时把右/下边界夹进视口**
（放不下就翻到上方），宽度限制在 `min(320px, 100vw - 16px)`。
内容：标签被截断就显示完整标签文字，否则显示英文字段名；两者都没有就不弹。

Element Plus 的浮层（枚举下拉、取色器面板）另在 `styles/element-plus-theme.css` 里统一
`max-width: min(320px, calc(100vw - 16px))`——它们默认只翻转/位移，不收宽度。

---

## 写配置时的两个坑（都有测试兜着）

1. **字段名写错不会报错**，只会多出一个永远不显示的配置项——`packages/editor/test/objectViewSchema.spec.ts`
   拿描述表逐条核对，拼错就红（它已经抓到过 `TextureMaterial.cullFace` 这种"照抄隔壁类型"的错误：
   `TextureMaterial` 根本没有 `cullFace`）。
2. **`block` 写了个没在 `blocks` 里声明的名字**，那几个字段会静静落进一个没声明过的分组，
   分组顺序也不再受控——同上测试会逐个检查。

另外：**类型上 `readonly` 的字段不影响面板可编辑**。纯数据接口里被响应式追踪的字段一律
`readonly`（根规范 §8.5），那是"不能直接赋值"的意思；面板写入统一经响应式代理
（`utils/createWriteBridge.ts` → `reactive(data).field = v`，§11.3）。

---

## 相关文件

| 文件 | 作用 |
|---|---|
| `scripts/gen-objectview-schema.mjs` | 从 TS 类型生成描述表；`--check` 是 CI 门禁 |
| `src/vue-app/objectview/generated/dataTypeSchema.ts` | 生成的描述表（56 个类型 / 328 个字段） |
| `src/vue-app/objectview/dataTypeSchema.ts` | 描述表的类型定义与注册入口 |
| `src/configs/objectViewSchema.ts` | **人工配置**（分组 / 显示名 / 范围 / 视图） |
| `src/plugins/builtinObjectView.ts` | 属性面板插件的**清单**：默认视图、类型→控件、描述表、人工配置（issue #170 前是 `src/configs/ObjectViewConfig.ts` 的模块顶层调用） |
| `src/plugins/install.ts` | 把清单落到 `objectview` 单例的唯一一处（`applyPluginContributions`） |
| `src/vue-app/objectview/utils/createWriteBridge.ts` | 面板写入 → 引擎响应式的桥（§11.3） |
| `packages/objectview/src/ObjectView.ts` | 两级字段发现与合并（`setDataTypeSchema` / `setObjectViewConfig`） |

单元测试：`packages/objectview/test/fieldDiscovery.spec.ts`（发现与合并）、
`packages/editor/test/objectViewSchema.spec.ts`（配置体检）、
`packages/editor/test/dataTypeSchemaGenerated.spec.ts`（产物不变量）、
`packages/editor/test/objectviewWriteBridge.spec.ts`（写入契约）。
