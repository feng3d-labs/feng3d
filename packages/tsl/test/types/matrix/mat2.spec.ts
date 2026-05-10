import { describe, expect, it } from 'vitest';
import { mat2, Mat2 } from '../../../src/types/matrix/mat2';
import { vec2 } from '../../../src/types/vector/vec2';
import { float } from '../../../src/types/scalar/float';

describe('Mat2', () =>
{
    describe('构造函数', () =>
    {
        it('应该支持对角矩阵构造（number）', () =>
        {
            const m = mat2(1.0);

            expect(m.toGLSL()).toBe('mat2(1.0)');
            expect(m.toWGSL()).toBe('mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0))');
            expect(m.dependencies).toEqual([]);
        });

        it('应该支持从列向量构造', () =>
        {
            const col0 = vec2(1.0, 0.0);
            const col1 = vec2(0.0, 1.0);
            const m = mat2(col0, col1);

            expect(m.toGLSL()).toBe('mat2(vec2(1.0, 0.0), vec2(0.0, 1.0))');
            expect(m.toWGSL()).toBe('mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0))');
            expect(m.dependencies).toContain(col0);
            expect(m.dependencies).toContain(col1);
        });

        it('应该支持从 4 个元素构造（number）', () =>
        {
            const m = mat2(1.0, 2.0, 3.0, 4.0);

            expect(m.toGLSL()).toBe('mat2(1.0, 2.0, 3.0, 4.0)');
            expect(m.toWGSL()).toBe('mat2x2<f32>(1.0, 2.0, 3.0, 4.0)');
        });

        it('应该支持从 4 个 Float 构造', () =>
        {
            const m00 = float(1.0);
            const m01 = float(2.0);
            const m10 = float(3.0);
            const m11 = float(4.0);
            const m = mat2(m00, m01, m10, m11);

            expect(m.toGLSL()).toBe('mat2(1.0, 2.0, 3.0, 4.0)');
            expect(m.dependencies).toContain(m00);
            expect(m.dependencies).toContain(m01);
            expect(m.dependencies).toContain(m10);
            expect(m.dependencies).toContain(m11);
        });

        it('空构造函数应该返回未初始化的 Mat2', () =>
        {
            const m = mat2();

            expect(m).toBeInstanceOf(Mat2);
            expect(m.glslType).toBe('mat2');
            expect(m.wgslType).toBe('mat2x2<f32>');
        });
    });

    describe('multiply 方法', () =>
    {
        it('应该支持矩阵与向量乘法', () =>
        {
            const m = mat2(1.0);
            const v = vec2(1.0, 2.0);
            const result = m.multiply(v);

            expect(result.toGLSL()).toBe('mat2(1.0) * vec2(1.0, 2.0)');
            expect(result.toWGSL()).toBe('mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0)) * vec2<f32>(1.0, 2.0)');
            expect(result.dependencies).toContain(m);
            expect(result.dependencies).toContain(v);
        });

        it('应该支持矩阵与矩阵乘法', () =>
        {
            const m1 = mat2(1.0);
            const m2 = mat2(2.0);
            const result = m1.multiply(m2);

            expect(result).toBeInstanceOf(Mat2);
            expect(result.toGLSL()).toContain('mat2(1.0) * mat2(2.0)');
            expect(result.dependencies).toContain(m1);
            expect(result.dependencies).toContain(m2);
        });
    });
});
