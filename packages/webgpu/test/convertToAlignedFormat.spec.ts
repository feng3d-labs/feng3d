import { assert, describe, it } from 'vitest';
import { convertToAlignedFormat } from '../src/utils/convertToAlignedFormat';

describe('convertToAlignedFormat', () =>
{
    describe('mat4x3', () =>
    {
        it('应将紧凑格式（12 float）转换为对齐格式（16 float）', () =>
        {
            const compact = new Float32Array([
                1, 2, 3,    // 列 0
                4, 5, 6,    // 列 1
                7, 8, 9,    // 列 2
                10, 11, 12, // 列 3
            ]);

            const result = convertToAlignedFormat(compact, 'mat4x3f');

            assert.strictEqual(result.length, 16);
            // 列 0
            assert.strictEqual(result[0], 1);
            assert.strictEqual(result[1], 2);
            assert.strictEqual(result[2], 3);
            assert.strictEqual(result[3], 0); // padding
            // 列 1
            assert.strictEqual(result[4], 4);
            assert.strictEqual(result[5], 5);
            assert.strictEqual(result[6], 6);
            assert.strictEqual(result[7], 0); // padding
            // 列 2
            assert.strictEqual(result[8], 7);
            assert.strictEqual(result[9], 8);
            assert.strictEqual(result[10], 9);
            assert.strictEqual(result[11], 0); // padding
            // 列 3
            assert.strictEqual(result[12], 10);
            assert.strictEqual(result[13], 11);
            assert.strictEqual(result[14], 12);
            assert.strictEqual(result[15], 0); // padding
        });

        it('已是对齐格式（16 float）时应直接返回', () =>
        {
            const aligned = new Float32Array([
                1, 2, 3, 0,
                4, 5, 6, 0,
                7, 8, 9, 0,
                10, 11, 12, 0,
            ]);

            const result = convertToAlignedFormat(aligned, 'mat4x3f');

            assert.strictEqual(result, aligned); // 应返回同一个数组
        });
    });

    describe('mat3x3', () =>
    {
        it('应将紧凑格式（9 float）转换为对齐格式（12 float）', () =>
        {
            const compact = new Float32Array([
                1, 2, 3,  // 列 0
                4, 5, 6,  // 列 1
                7, 8, 9,  // 列 2
            ]);

            const result = convertToAlignedFormat(compact, 'mat3x3f');

            assert.strictEqual(result.length, 12);
            // 列 0
            assert.strictEqual(result[0], 1);
            assert.strictEqual(result[1], 2);
            assert.strictEqual(result[2], 3);
            assert.strictEqual(result[3], 0); // padding
            // 列 1
            assert.strictEqual(result[4], 4);
            assert.strictEqual(result[5], 5);
            assert.strictEqual(result[6], 6);
            assert.strictEqual(result[7], 0); // padding
            // 列 2
            assert.strictEqual(result[8], 7);
            assert.strictEqual(result[9], 8);
            assert.strictEqual(result[10], 9);
            assert.strictEqual(result[11], 0); // padding
        });

        it('已是对齐格式（12 float）时应直接返回', () =>
        {
            const aligned = new Float32Array([
                1, 2, 3, 0,
                4, 5, 6, 0,
                7, 8, 9, 0,
            ]);

            const result = convertToAlignedFormat(aligned, 'mat3x3f');

            assert.strictEqual(result, aligned);
        });
    });

    describe('mat2x3', () =>
    {
        it('应将紧凑格式（6 float）转换为对齐格式（8 float）', () =>
        {
            const compact = new Float32Array([
                1, 2, 3, // 列 0
                4, 5, 6, // 列 1
            ]);

            const result = convertToAlignedFormat(compact, 'mat2x3f');

            assert.strictEqual(result.length, 8);
            // 列 0
            assert.strictEqual(result[0], 1);
            assert.strictEqual(result[1], 2);
            assert.strictEqual(result[2], 3);
            assert.strictEqual(result[3], 0); // padding
            // 列 1
            assert.strictEqual(result[4], 4);
            assert.strictEqual(result[5], 5);
            assert.strictEqual(result[6], 6);
            assert.strictEqual(result[7], 0); // padding
        });

        it('已是对齐格式（8 float）时应直接返回', () =>
        {
            const aligned = new Float32Array([
                1, 2, 3, 0,
                4, 5, 6, 0,
            ]);

            const result = convertToAlignedFormat(aligned, 'mat2x3f');

            assert.strictEqual(result, aligned);
        });
    });

    describe('非 mat*x3 类型', () =>
    {
        it('mat4x4 应直接返回原数据', () =>
        {
            const data = new Float32Array(16).fill(1);

            const result = convertToAlignedFormat(data, 'mat4x4f');

            assert.strictEqual(result, data);
        });

        it('vec4 应直接返回原数据', () =>
        {
            const data = new Float32Array([1, 2, 3, 4]);

            const result = convertToAlignedFormat(data, 'vec4f');

            assert.strictEqual(result, data);
        });

        it('mat4x2 应直接返回原数据', () =>
        {
            const data = new Float32Array(8).fill(1);

            const result = convertToAlignedFormat(data, 'mat4x2f');

            assert.strictEqual(result, data);
        });
    });

    describe('不同数据类型', () =>
    {
        it('Int32Array 应正确转换', () =>
        {
            const compact = new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

            const result = convertToAlignedFormat(compact, 'mat4x3i');

            assert.ok(result instanceof Int32Array);
            assert.strictEqual(result.length, 16);
        });

        it('Uint32Array 应正确转换', () =>
        {
            const compact = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

            const result = convertToAlignedFormat(compact, 'mat4x3u');

            assert.ok(result instanceof Uint32Array);
            assert.strictEqual(result.length, 16);
        });
    });

    describe('数据大小不匹配', () =>
    {
        it('数据大小既非紧凑也非对齐格式时应返回原数据并警告', () =>
        {
            const wrongSize = new Float32Array([1, 2, 3, 4, 5]); // 5 个元素，不匹配

            const result = convertToAlignedFormat(wrongSize, 'mat4x3f');

            assert.strictEqual(result, wrongSize); // 返回原数据
        });
    });
});
