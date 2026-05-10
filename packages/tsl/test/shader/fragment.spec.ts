import { describe, expect, it } from 'vitest';
import { attribute } from '../../src/variables/attribute';
import { gl_Position } from '../../src/glsl/builtin/builtins';
import { vec2 } from '../../src/types/vector/vec2';
import { vec4 } from '../../src/types/vector/vec4';
import { Fragment, fragment } from '../../src/shader/fragment';
import { return_ } from '../../src/index';
import { varying } from '../../src/variables/varying';
import { vertex } from '../../src/shader/vertex';

describe('Fragment', () =>
{
    describe('Fragment 类', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(frag.name).toBe('main');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = frag.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const frag = new Fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('fragment() 函数', () =>
    {
        it('应该能够创建 Fragment 实例', () =>
        {
            const frag = fragment('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(frag).toBeInstanceOf(Fragment);
            expect(frag.name).toBe('main');
        });
    });

    describe('varying location 自动分配', () =>
    {
        it('应该能够自动分配 varying 的 location', () =>
        {
            const vColor = varying('vColor', vec4());
            const vTexCoord = varying('vTexCoord', vec2());

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const wgsl = frag.toWGSL();
            // 验证自动分配的 varying location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
        });

        it('应该能够与 vertex shader 的 varying location 保持一致', () =>
        {
            const aPos = attribute('aPos', vec2());
            const vColor = varying('vColor', vec4());

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(aPos, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0)); // 实际使用 varying
            });

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const vertexWgsl = vert.toWGSL();
            const fragmentWgsl = frag.toWGSL(vert);

            // 验证 vertex 和 fragment shader 中的 varying location 一致
            const vertexLocationMatch = vertexWgsl.match(/@location\((\d+)\).*vColor/);
            const fragmentLocationMatch = fragmentWgsl.match(/@location\((\d+)\).*vColor/);

            expect(vertexLocationMatch).toBeTruthy();
            expect(fragmentLocationMatch).toBeTruthy();
            expect(vertexLocationMatch![1]).toBe(fragmentLocationMatch![1]);
        });

        it('应该能够生成包含 varying 的 VaryingStruct', () =>
        {
            const vColor = varying('vColor', vec4());

            const frag = fragment('main', () =>
            {
                return_(vColor);
            });

            const wgsl = frag.toWGSL();
            // 验证生成了 FragmentInput
            expect(wgsl).toContain('struct FragmentInput');
            expect(wgsl).toContain('@location(0) vColor: vec4<f32>');
            // 验证函数接收 FragmentInput 参数
            expect(wgsl).toContain('input: FragmentInput');

            const glsl = frag.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
            expect(glsl).toContain('gl_FragColor = vColor;');
        });
    });
});
