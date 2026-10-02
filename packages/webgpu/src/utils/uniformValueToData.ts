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

    return new Cls(value as ArrayLike<number>);
}
