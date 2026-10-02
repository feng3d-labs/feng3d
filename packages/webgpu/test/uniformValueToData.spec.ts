import { assert, describe, it } from 'vitest';
import { isMatrixData, uniformValueToData } from '../src/utils/uniformValueToData';

const { deepEqual, equal } = assert;

/**
 * 统一块变量值 → 上传 TypedArray 的转换（issue #134 阶段 C-e）。
 *
 * 这一条分支是**最容易静默失效**的地方：`Matrix4x4` / `Matrix3x3` 的 class 在 C-e 被删除后，
 * uniform 里拿到的是 `{ __type__: 'Matrix4x4', elements: number[] }` 纯数据字面量——
 * 它既没有数字索引也没有 length，`new Float32Array(value)` 会得到**长度 0 的空数组**，
 * 结果是 uniform 全 0（画面全黑）而**不报任何错**。所以这里逐条锁住转换结果。
 *
 * 本文件不需要 `GPUDevice`：转换逻辑已抽成纯函数（`src/utils/uniformValueToData.ts`）。
 */
describe('uniformValueToData', () =>
{
    it('纯数据 Matrix4x4（16 个 elements）转成等值的 Float32Array（而不是长度 0）', () =>
    {
        const matrix = {
            __type__: 'Matrix4x4' as const,
            elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 4, 5, 1],
        };

        const data = uniformValueToData(matrix, Float32Array);

        equal(data.length, 16, '长度必须与 elements 一致（退化成 0 就是 uniform 静默全 0）');
        deepEqual([...data], [...matrix.elements]);
    });

    it('纯数据 Matrix3x3（9 个 elements）转成等值的 Float32Array', () =>
    {
        const matrix = { __type__: 'Matrix3x3' as const, elements: [1, 2, 3, 4, 5, 6, 7, 8, 9] };

        const data = uniformValueToData(matrix, Float32Array);

        equal(data.length, 9);
        deepEqual([...data], [...matrix.elements]);
    });

    it('elements 是 TypedArray 时同样按 elements 取值', () =>
    {
        const matrix = { elements: new Float64Array([1, 2, 3, 4]) };

        const data = uniformValueToData(matrix, Float32Array);

        deepEqual([...data], [1, 2, 3, 4]);
    });

    it('isMatrixData 只接受带 elements 数组的对象', () =>
    {
        equal(isMatrixData({ elements: [1] }), true);
        equal(isMatrixData({ elements: new Float32Array(16) }), true);
        equal(isMatrixData({ elements: 3 }), false);
        equal(isMatrixData({ x: 1, y: 2, z: 3 }), false);
        equal(isMatrixData(null), false);
        equal(isMatrixData(3), false);
    });

    it('number 转成长度 1 的数组（原行为）', () =>
    {
        deepEqual([...uniformValueToData(2.5, Float32Array)], [2.5]);
    });

    it('同类型的 TypedArray 原样透传（原行为）', () =>
    {
        const source = new Float32Array([1, 2, 3]);

        equal(uniformValueToData(source, Float32Array), source);
    });

    it('带 toArray 的容器走 toArray（原行为，class 时代的 Matrix4x4 就走这条）', () =>
    {
        const container = { toArray: () => [7, 8, 9] };

        deepEqual([...uniformValueToData(container, Float32Array)], [7, 8, 9]);
    });

    it('纯数据 Color4 走 logic 取扁平数组（原行为）', () =>
    {
        const color = { __type__: 'Color4' as const, r: 0.25, g: 0.5, b: 0.75, a: 1 };

        deepEqual([...uniformValueToData(color, Float32Array)], [0.25, 0.5, 0.75, 1]);
    });
});
