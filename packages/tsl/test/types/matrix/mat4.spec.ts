import { describe, expect, it } from 'vitest';
import { mat4, Mat4 } from '../../../src/types/matrix/mat4';
import { vec4, Vec4 } from '../../../src/types/vector/vec4';
import { uniform } from '../../../src/variables/uniform';

describe('Mat4', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Mat4 实例', () =>
        {
            const m = new Mat4();
            expect(m).toBeInstanceOf(Mat4);
        });

        it('应该从 uniform 创建 Mat4 实例', () =>
        {
            const m = uniform('uMatrix', mat4(), 0, 0);
            expect(m).toBeInstanceOf(Mat4);
            expect(m.toGLSL()).toBe('uMatrix');
            expect(m.toWGSL()).toBe('uMatrix');
        });

    });

    describe('multiply', () =>
    {
        it('应该支持 Mat4 乘以 Mat4，返回 Mat4', () =>
        {
            const m1 = uniform('uMatrix1', mat4(), 0, 0);
            const m2 = uniform('uMatrix2', mat4(), 0, 1);

            const result = m1.multiply(m2);
            expect(result).toBeInstanceOf(Mat4);
            expect(result.toGLSL()).toBe('uMatrix1 * uMatrix2');
            expect(result.toWGSL()).toBe('uMatrix1 * uMatrix2');
        });

        it('应该支持 Mat4 乘以 Vec4，返回 Vec4', () =>
        {
            const m = uniform('uMatrix', mat4(), 0, 0);
            const v = vec4(1.0, 2.0, 3.0, 4.0);

            const result = m.multiply(v);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL()).toBe('uMatrix * vec4(1.0, 2.0, 3.0, 4.0)');
            expect(result.toWGSL()).toBe('uMatrix * vec4<f32>(1.0, 2.0, 3.0, 4.0)');
        });

        it('应该支持链式调用 Mat4.multiply(Mat4).multiply(Vec4)', () =>
        {
            const m1 = uniform('uProjection', mat4(), 0, 0);
            const m2 = uniform('uModelView', mat4(), 0, 1);
            const v = vec4(1.0, 2.0, 3.0, 4.0);

            const intermediate = m1.multiply(m2);
            const result = intermediate.multiply(v);
            expect(result).toBeInstanceOf(Vec4);
            // 中间结果是 Mat4，其 toGLSL 返回 'uProjection * uModelView'
            // 然后这个结果乘以 Vec4
            expect(result.toGLSL()).toBe('uProjection * uModelView * vec4(1.0, 2.0, 3.0, 4.0)');
            expect(result.toWGSL()).toBe('uProjection * uModelView * vec4<f32>(1.0, 2.0, 3.0, 4.0)');
        });
    });
});

describe('mat4', () =>
{
    describe('mat4(diagonal: number)', () =>
    {
        it('应该返回 Mat4 实例', () =>
        {
            const result = mat4(1.0);
            expect(result).toBeInstanceOf(Mat4);
            expect(result.toGLSL()).toBe('mat4(1.0)');
        });
    });

});

