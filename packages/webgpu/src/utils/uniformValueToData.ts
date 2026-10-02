import { logic } from '@feng3d/reactivity';
import { isColor4Data } from '../caches/color4Logic';

/**
 * 统一块变量值 → 上传用 TypedArray 的转换（issue #134 阶段 C-e 从
 * `WGPUBufferBinding.updateBufferBinding` 的 computed 里抽出来的**纯函数**）。
 *
 * 抽出来的动机：`Matrix4x4` / `Matrix3x3` 的 class 在阶段 C-e 被删除，变成了
 * `{ __type__: 'Matrix4x4', elements: number[] }` 这样的**纯数据字面量**。
 * 原来它们靠实例上的 `toArray()` 被识别，class 一删就只剩「既无数字索引也无 length」
 * 的普通对象，`new Cls(value)` 会得到**长度 0 的空数组**（uniform 静默读到全 0，
 * 渲染结果全黑但不报错）。所以这里必须认识矩阵的纯数据形态。
 *
 * 抽成导出函数之后，这条最容易静默失效的分支就能在没有 `GPUDevice` 的情况下被单测覆盖
 * （见 `packages/webgpu/test/uniformValueToData.spec.ts`）。
 */

/** `BufferBindingInfo.items[i].Cls` 的类型（四种数值容器的构造器）。 */
export type UniformDataConstructor =
    | Float32ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Int16ArrayConstructor;

/** 上传数据（与 `BufferBindingInfo.items[i].Cls` 一一对应）。 */
export type UniformData = Float32Array | Int32Array | Uint32Array | Int16Array;

/**
 * 纯数据矩阵形状：`@feng3d/math` 的 `Matrix4x4` / `Matrix3x3` 在阶段 C-e 之后就是这个形状
 * （`elements` 是 16 / 9 个数字的扁平数组）。
 */
export interface MatrixDataLike
{
    readonly elements: ArrayLike<number>;
}

/** 是否为带扁平 `elements` 数组的纯数据矩阵（`Matrix4x4` / `Matrix3x3`）。 */
export function isMatrixData(value: unknown): value is MatrixDataLike
{
    if (typeof value !== 'object' || value === null) return false;
    const elements = (value as { elements?: unknown }).elements;

    // `number[]` 与 TypedArray 都接受（`ArrayLike<number>` 的两种常见载体）
    return Array.isArray(elements) || ArrayBuffer.isView(elements);
}

/**
 * 纯数据向量形状：`@feng3d/math` 的 `Vector2` / `Vector3` / `Vector4` 在阶段 C-f 之后就是这个形状
 * （`{ x, y }` / `{ x, y, z }` / `{ x, y, z, w }`，`z` / `w` 按存在与否决定分量个数）。
 */
export interface VectorDataLike
{
    readonly x: number;
    readonly y: number;
    readonly z?: number;
    readonly w?: number;
}

/**
 * 是否为纯数据向量（`Vector2` / `Vector3` / `Vector4`）。
 *
 * 判据只看「有 `x` 与 `y` 两个数字分量」，`z` / `w` 存在时也必须是数字——
 * 这样 `{ x, y, z, w }` 的矩阵不会被误判（矩阵没有 `x`），Color4 也没有 `x`。
 */
export function isVectorData(value: unknown): value is VectorDataLike
{
    if (typeof value !== 'object' || value === null) return false;
    const v = value as { x?: unknown; y?: unknown; z?: unknown; w?: unknown };

    if (typeof v.x !== 'number' || typeof v.y !== 'number') return false;
    if (v.z !== undefined && typeof v.z !== 'number') return false;
    if (v.w !== undefined && typeof v.w !== 'number') return false;

    return true;
}

/**
 * 纯数据向量的分量（上传顺序与 class 时代的 `toArray()` 逐位相同：x → y → z → w）。
 */
export function vectorDataToArray(value: VectorDataLike): number[]
{
    const out = [value.x, value.y];

    if (typeof value.z === 'number') out.push(value.z);
    if (typeof value.w === 'number') out.push(value.w);

    return out;
}

/**
 * 把统一块变量从 `paths` 上取到的**叶子值**转为上传用 TypedArray。
 *
 * 分支顺序与 `WGPUBufferBinding` 原实现逐条一致（只多了一条纯数据矩阵），
 * 包括「`value` 为 `null` 时读 `constructor` 会抛 TypeError」这一既有行为。
 */
export function uniformValueToData(value: unknown, Cls: UniformDataConstructor): UniformData
{
    if (typeof value === 'number')
    {
        return new Cls([value]);
    }
    // 可能为 null；原实现在这里 `null.constructor` 会抛 TypeError，保持不变
    if ((value as { constructor: { name: string } }).constructor.name === Cls.name)
    {
        return value as UniformData;
    }
    // Color4 / Vector3 / Matrix4x4 等数值容器既无数字索引也无 length，
    // `new Cls(value)` 会得到长度 0 的空数组（uniform 读到全 0）。
    // 用 toArray() 取扁平数值（UniformDataItem 类型契约支持的形式）。
    if (typeof (value as { toArray?: unknown }).toArray === 'function')
    {
        return new Cls((value as { toArray: () => ArrayLike<number> }).toArray());
    }
    if (isColor4Data(value))
    {
        // 纯数据 Color4（{ __type__: 'Color4', r, g, b, a }，无 class）：
        // 通过 logic 取响应式扁平数组 [r,g,b,a]。computed 内部读取
        // reactive(color4) 的 r/g/b/a，因此任一分量变化都会让本 computed 失效。
        return new Cls(logic(value).value.value);
    }
    if (isMatrixData(value))
    {
        // 纯数据矩阵（{ __type__: 'Matrix4x4' | 'Matrix3x3', elements: number[] }，
        // 阶段 C-e 起这两个 class 已删除，不再有 toArray）。
        // `elements` 与 class 的 `toArray()` 逐位相同，所以上传数据逐位不变。
        return new Cls(value.elements);
    }
    if (isVectorData(value))
    {
        // 纯数据向量（{ x, y(, z)(, w) }，阶段 C-f 起 `Vector2` / `Vector3` / `Vector4`
        // 的 class 已删除，不再有 toArray）。
        //
        // ★ 这是本批最容易静默失效的一条：`u_Viewport` 之类 uniform 的值一旦是纯数据字面量，
        // 缺少这条分支就会 `new Cls(value)` 得到**长度 0 的空数组**（uniform 读到全 0，
        // 画面悄悄变错而不报错）。分量顺序与 class 的 `toArray()` 逐位一致。
        return new Cls(vectorDataToArray(value));
    }

    return new Cls(value as ArrayLike<number>);
}
