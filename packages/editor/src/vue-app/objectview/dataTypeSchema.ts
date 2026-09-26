/**
 * 属性面板的字段描述表：类型定义与注册入口（issue #147 方案 B 的消费侧）。
 *
 * ## 为什么需要它
 *
 * 纯数据对象上只有**用户显式写过的**字段——`{ __type__: 'PerspectiveCamera' }` 的
 * `Object.keys` 就只有一个 `__type__`，而 `logic()` 前后字段完全一致（工厂不补默认值），
 * Logic 上的 getter 又全是计算型的（`projectionMatrix` 那类，不是可编辑数据）。
 * 字段清单只存在于 TypeScript 类型里，而 interface 编译后完全消失。
 *
 * 所以面板要列出哪些字段，只能从**类型**里拿——这就是
 * `generated/dataTypeSchema.ts`（由 `scripts/gen-objectview-schema.mjs` 从
 * `packages/feng3d` 的纯数据接口生成）存在的理由。
 *
 * ## 依赖方向
 *
 * 描述表放在编辑器侧、由编辑器注册给 `objectview`，而不是让 `objectview` 去读 feng3d 的类型：
 * `objectview` 是下层包，不该依赖上层（根规范 §15 R1：依赖只向下）。
 *
 * ## 两级字段发现
 *
 * 1. **描述表命中**（方案 B）：字段清单来自类型，与对象上是否赋过值无关，
 *    因此 AI 写的裸字面量也能列出全部可编辑字段；字段的控件种类也由类型给出，
 *    不会退化成默认视图。
 * 2. **兜底**（方案 C）：描述表里没有这个 `__type__` 时，退回「对象上实际存在的字段」
 *    （`objectview` 的 `getDefaultClassConfig`）。类型只能由运行时值推断，
 *    所以 `{x,y,z}` 那种会被识别成普通对象而不是 `Vector3`——这是兜底的固有天花板。
 */
import type { DataTypeSchema } from './generated/dataTypeSchema';

/**
 * 单个字段的描述。
 *
 * 由生成器产出。`control` 的取值与
 * `objectview.setDefaultTypeAttributeView(type, ...)` 的注册名一致，
 * 见 [ObjectViewConfig.ts](../../../configs/ObjectViewConfig.ts)。
 */
export interface DataTypeFieldSchema
{
    /** 字段名 */
    readonly name: string;

    /** TS 类型原文（用于提示与排查；`Geometrys` 这类别名不再展开） */
    readonly type: string;

    /**
     * 控件种类。
     *
     * `number` / `Boolean` / `String` / `Vector2` / `Vector3` / `Vector4` /
     * `Color3` / `Color4` / `Array` / `Enum` / `Object` / `Default`。
     */
    readonly control: string;

    /** 类型上是可选字段（`field?: T`） */
    readonly optional?: boolean;

    /**
     * 类型上是只读字段。
     *
     * 纯数据接口里被响应式追踪的字段一律 `readonly`（根规范 §8.5），所以**几乎所有字段
     * 都是 `readonly: true`**。它描述的是"不能直接赋值"，而不是"面板里不可编辑"——
     * 可编辑性由 `objectview` 的 `editable` 决定，写入一律经响应式代理（§11.3）。
     */
    readonly readonly?: boolean;

    /** `control === 'Enum'` 时的候选值（TS enum 的成员名，或字符串字面量联合的取值） */
    readonly values?: readonly string[];

    /**
     * 该枚举是**数字枚举**。
     *
     * 本仓库里的数字枚举是位标志（如 `RunEnvironment` 的 `1 << 0` / `1 << 1` / `(1 << 8) - 1`），
     * 用下拉单选表达它是错的，因此面板按只读展示处理，不提供编辑。
     */
    readonly numeric?: boolean;

    /** `control === 'Object'` 且是 `__type__` 联合时，可选的类型名列表（供面板选择并递归展开） */
    readonly typeNames?: readonly string[];

    /** `control === 'Array'` 时元素的控件种类 */
    readonly itemControl?: string;
}

/**
 * 描述表的宿主能力。
 *
 * 刻意用**结构化约束**而不是 `import type { ObjectView } from '@feng3d/objectview'`：
 * `objectview` 不是编辑器的直接依赖（经 `feng3d` 传递），直接 import 会变成幽灵依赖。
 * 这里只声明"我要求宿主具备这个能力"，至于是谁提供的与本文件无关。
 */
export interface DataTypeSchemaHost
{
    /**
     * 注册纯数据类型的字段描述表。
     *
     * @param schema `__type__` → 该类型的字段清单
     */
    setDataTypeSchema(schema: DataTypeSchema): void;
}

/**
 * 把生成的描述表注册给 objectview。
 *
 * @param host 具备 `setDataTypeSchema` 能力的宿主（即 objectview 单例）
 * @param schema `__type__` → 该类型的字段清单
 */
export function registerDataTypeSchema(host: DataTypeSchemaHost, schema: DataTypeSchema): void
{
    host.setDataTypeSchema(schema);
}
