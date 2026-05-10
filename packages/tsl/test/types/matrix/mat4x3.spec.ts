import { describe, expect, it } from 'vitest';
import { mat4x3, Mat4x3 } from '../../../src/types/matrix/mat4x3';
import { vec4 } from '../../../src/types/vector/vec4';
import { uniform } from '../../../src/variables/uniform';
import { fragment } from '../../../src/shader/fragment';
import { return_ } from '../../../src/control/return';

describe('Mat4x3', () =>
{
    describe('构造函数', () =>
    {
        it('空构造函数应该返回未初始化的 Mat4x3', () =>
        {
            const m = mat4x3();

            expect(m).toBeInstanceOf(Mat4x3);
            expect(m.glslType).toBe('mat4x3');
            expect(m.wgslType).toBe('mat4x3<f32>');
        });
    });

    describe('multiply 方法', () =>
    {
        it('应该支持矩阵与 vec4 乘法', () =>
        {
            const m = uniform('MVP', mat4x3());
            const v = vec4(1.0, 2.0, 3.0, 1.0);
            const result = m.multiply(v);

            expect(result.toGLSL()).toBe('MVP * vec4(1.0, 2.0, 3.0, 1.0)');
            expect(result.toWGSL()).toBe('MVP * vec4<f32>(1.0, 2.0, 3.0, 1.0)');
            expect(result.dependencies).toContain(m);
            expect(result.dependencies).toContain(v);
        });
    });

    describe('col 方法', () =>
    {
        it('应该能够访问矩阵的列', () =>
        {
            const m = uniform('MVP', mat4x3());
            const col0 = m.col(0);
            const col3 = m.col(3);

            expect(col0.toGLSL()).toBe('MVP[0]');
            expect(col0.toWGSL()).toBe('MVP[0]');
            expect(col3.toGLSL()).toBe('MVP[3]');
            expect(col3.toWGSL()).toBe('MVP[3]');
            expect(col0.dependencies).toContain(m);
        });
    });

    describe('在着色器中使用', () =>
    {
        it('应该能够在片段着色器中使用', () =>
        {
            const MVP = uniform('MVP', mat4x3());

            const frag = fragment('main', () =>
            {
                const v = vec4(1.0, 0.0, 0.0, 1.0);
                const result = MVP.multiply(v);
                return_(vec4(result, 1.0));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform mat4x3 MVP;');
            expect(glsl).toContain('MVP * vec4(1.0, 0.0, 0.0, 1.0)');
        });
    });
});
