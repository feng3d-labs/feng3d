import { describe, expect, it } from 'vitest';
import { Varying, varying } from '../../src/variables/varying';
import { vec2, Vec2 } from '../../src/types/vector/vec2';
import { vec4, Vec4 } from '../../src/types/vector/vec4';
import { int, Int } from '../../src/types/scalar/int';
import { vertex } from '../../src/shader/vertex';
import { fragment } from '../../src/shader/fragment';
import { array, return_, struct, uniform } from '../../src/index';
import { gl_FragColor, gl_InstanceID, gl_Position } from '../../src/glsl/builtin/builtins';

describe('Varying', () =>
{
    describe('varying() 函数', () =>
    {
        it('应该能够创建 varying 并返回对应类型', () =>
        {
            const v = varying('vColor', vec4(), { location: 0 });
            expect(v).toBeInstanceOf(Vec4);
            expect(v.toGLSL()).toBe('vColor');
            expect(v.toWGSL()).toBe('vColor');
        });

        it('应该支持不同类型的 varying', () =>
        {
            const vColor = varying('vColor', vec4());
            expect(vColor).toBeInstanceOf(Vec4);

            const vTexCoord = varying('vTexCoord', vec2());
            expect(vTexCoord).toBeInstanceOf(Vec2);

            const vInstance = varying('vInstance', int(), { interpolation: 'flat' });
            expect(vInstance).toBeInstanceOf(Int);
        });

        it('应该能够在 vertex shader 中使用', () =>
        {
            const vColor = varying('vColor', vec4(), { location: 0 });

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            // 验证生成的着色器代码中包含 varying 声明
            const glsl = vertexShader.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该支持 location 缺省时的自动分配', () =>
        {
            const vColor = varying('vColor', vec4());
            const vTexCoord = varying('vTexCoord', vec2());

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toMatch(/@location\(0\).*vColor/);
            expect(wgsl).toMatch(/@location\(1\).*vTexCoord/);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const vColor = varying('vColor', vec4(), { location: 2 }); // 显式指定 location 2
            const vTexCoord = varying('vTexCoord', vec2()); // 自动分配

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain('@location(2) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(0) vTexCoord: vec2<f32>');
        });
    });

    describe('独立定义的 varying', () =>
    {
        it('应该能够独立定义 varying 并自动生成 VaryingStruct', () =>
        {
            const v_st = varying('v_st', vec2());

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                v_st.assign(vec2(0.5, 0.5));
            });

            const wgsl = vertexShader.toWGSL();
            // VertexOutput 应该包含 position builtin 和 varying
            expect(wgsl).toContain('struct VertexOutput');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('@location(0) v_st: vec2<f32>');
            // 赋值语句应该使用 output.v_st 格式
            expect(wgsl).toContain('output.v_st = ');
        });

        it('应该能够只使用 gl_Position 而不声明任何 varying', () =>
        {
            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 应该生成 VertexOutput 包含 position builtin
            expect(wgsl).toContain('struct VertexOutput');
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('output.position = ');
        });

        it('应该能够在片段着色器中使用独立 varying', () =>
        {
            const v_st = varying('v_st', vec2());

            const fragmentShader = fragment('main', () =>
            {
                return_(vec4(v_st.x, v_st.y, 0.0, 1.0));
            });

            const glsl = fragmentShader.toGLSL(2);
            // GLSL 应该声明 varying
            expect(glsl).toContain('in vec2 v_st;');

            const wgsl = fragmentShader.toWGSL();
            // WGSL 应该生成 FragmentInput 并在函数中接收
            expect(wgsl).toContain('struct FragmentInput');
            expect(wgsl).toContain('@location(0) v_st: vec2<f32>');
            expect(wgsl).toContain('input: FragmentInput');
            // 应该使用 input.v_st 访问
            expect(wgsl).toContain('input.v_st');
        });
    });

    describe('WGSL @interpolate(flat) 属性', () =>
    {
        it('应该为整数类型 varying 添加 @interpolate(flat) 属性', () =>
        {
            const instance = varying('instance', int(), { interpolation: 'flat' });

            const vertexShader = vertex('main', () =>
            {
                instance.assign(int(gl_InstanceID));
                gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();

            expect(wgsl).toContain('@location(0) @interpolate(flat) instance: i32');
        });

        it('应该在片段着色器中也包含 @interpolate(flat) 属性', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 2),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const vertexShader = vertex('main', () =>
            {
                instance.assign(int(gl_InstanceID));
                gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            vertexShader.toWGSL();

            const wgsl = fragmentShader.toWGSL(vertexShader);

            expect(wgsl).toContain('@location(0) @interpolate(flat) instance: i32');
        });
    });

    describe('Fragment shader 中 varying 访问路径', () =>
    {
        it('应该在片段着色器中使用 input.xxx 格式访问 varying', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 2),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const vertexShader = vertex('main', () =>
            {
                instance.assign(int(gl_InstanceID));
                gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            vertexShader.toWGSL();

            const wgsl = fragmentShader.toWGSL(vertexShader);

            expect(wgsl).toContain('input: FragmentInput');
            expect(wgsl).toContain('input.instance');
        });

        it('应该在数组索引中正确使用 input.xxx 格式', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 2),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const vertexShader = vertex('main', () =>
            {
                instance.assign(int(gl_InstanceID));
                gl_Position.assign(vec4(0.0, 0.0, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            vertexShader.toWGSL();

            const wgsl = fragmentShader.toWGSL(vertexShader);

            expect(wgsl).toContain('material.Diffuse[input.instance % 2]');
        });
    });
});
