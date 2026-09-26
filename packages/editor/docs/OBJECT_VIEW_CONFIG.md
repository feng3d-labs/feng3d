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
| `src/configs/ObjectViewConfig.ts` | 注册：类型→控件、描述表、配置 |
| `src/vue-app/objectview/utils/createWriteBridge.ts` | 面板写入 → 引擎响应式的桥（§11.3） |
| `packages/objectview/src/ObjectView.ts` | 两级字段发现与合并（`setDataTypeSchema` / `setObjectViewConfig`） |

单元测试：`packages/objectview/test/fieldDiscovery.spec.ts`（发现与合并）、
`packages/editor/test/objectViewSchema.spec.ts`（配置体检）、
`packages/editor/test/dataTypeSchemaGenerated.spec.ts`（产物不变量）、
`packages/editor/test/objectviewWriteBridge.spec.ts`（写入契约）。
