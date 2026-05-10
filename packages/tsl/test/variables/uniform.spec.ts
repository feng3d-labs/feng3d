import { describe, expect, it } from 'vitest';
import { uniform } from '../../src/variables/uniform';
import { vec4, Vec4 } from '../../src/types/vector/vec4';
import { mat4, Mat4 } from '../../src/types/matrix/mat4';
import { float, Float } from '../../src/types/scalar/float';
import { fragment } from '../../src/shader/fragment';
import { return_ } from '../../src/index';

describe('Uniform', () =>
{
    describe('uniform() 函数', () =>
    {
        it('应该能够创建 uniform 并返回对应类型', () =>
        {
            const color = uniform('color', vec4(), 0, 0);
            expect(color).toBeInstanceOf(Vec4);
            expect(color.toGLSL()).toBe('color');
            expect(color.toWGSL()).toBe('color');
        });

        it('应该能够在 fragment shader 中使用 uniform', () =>
        {
            const color = uniform('color', vec4(), 0, 0);

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            // 验证生成的着色器代码中包含 uniform 声明
            const glsl = fragmentShader.toGLSL();
            expect(glsl).toContain('uniform vec4 color;');
        });

        it('应该支持不同类型的 uniform', () =>
        {
            const colorVec4 = uniform('color', vec4(), 0, 0);
            expect(colorVec4).toBeInstanceOf(Vec4);

            const mvpMat4 = uniform('mvp', mat4(), 0, 1);
            expect(mvpMat4).toBeInstanceOf(Mat4);

            const timeFloat = uniform('time', float(), 0, 2);
            expect(timeFloat).toBeInstanceOf(Float);
        });
    });

    describe('group 和 binding', () =>
    {
        it('应该支持显式指定 group 和 binding', () =>
        {
            const color = uniform('color', vec4(), 0, 2);

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const wgsl = fragmentShader.toWGSL();
            expect(wgsl).toContain('@binding(2) @group(0) var<uniform> color');
        });

        it('应该支持只指定 group', () =>
        {
            const color = uniform('color', vec4(), 1);

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const wgsl = fragmentShader.toWGSL();
            expect(wgsl).toContain('@group(1)');
        });

        it('应该支持多个 uniform 的自动 binding 分配', () =>
        {
            const color1 = uniform('color1', vec4());
            const color2 = uniform('color2', vec4());

            const fragmentShader = fragment('main', () =>
            {
                return_(color1);
            });

            const wgsl = fragmentShader.toWGSL();
            // 验证自动分配的 binding
            expect(wgsl).toMatch(/@binding\(\d+\).*color1/);
        });
    });
});
