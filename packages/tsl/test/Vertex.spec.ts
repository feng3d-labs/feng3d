import { describe, expect, it } from 'vitest';
import { attribute } from '../src/variables/attribute';
import { gl_Position } from '../src/glsl/builtin/builtins';
import { mat4 } from '../src/types/matrix/mat4';
import { var_ } from '../src/variables/var';
import { vec2 } from '../src/types/vector/vec2';
import { vec3 } from '../src/types/vector/vec3';
import { vec4 } from '../src/types/vector/vec4';
import { uniform } from '../src/variables/uniform';
import { varying } from '../src/variables/varying';
import { Vertex, vertex } from '../src/shader/vertex';
import { return_ } from '../src/index';

describe('Vertex', () =>
{
    describe('Vertex 类', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert.name).toBe('main');
        });

        it('应该能够生成 GLSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const glsl = vert.toGLSL();
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该能够生成 WGSL 代码', () =>
        {
            const vert = new Vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('@vertex');
            expect(wgsl).toContain('fn main()');
            expect(wgsl).toContain('return vec4<f32>(1.0, 0.0, 0.0, 1.0);');
        });
    });

    describe('vertex() 函数', () =>
    {
        it('应该能够创建 Vertex 实例', () =>
        {
            const vert = vertex('main', () =>
            {
                return_(vec4(1.0, 0.0, 0.0, 1.0));
            });
            expect(vert).toBeInstanceOf(Vertex);
            expect(vert.name).toBe('main');
        });
    });

    describe('使用 gl_Position 和 varying 的写法', () =>
    {
        it('应该能够生成包含 varying 声明的 GLSL 代码', () =>
        {
            const aVertexColor = vec4(attribute('aVertexColor', 0));
            const vColor = vec4(varying('vColor', 0));

            const vert = vertex('main', () =>
            {
                const position = var_('position', vec4(1.0, 0.0, 0.0, 1.0));
                gl_Position.assign(position);
                vColor.assign(aVertexColor);
            });

            const glsl = vert.toGLSL();
            expect(glsl).toContain('varying vec4 vColor;');
            expect(glsl).toContain('gl_Position = position;');
            expect(glsl).toContain('vColor = aVertexColor;');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该能够自动分配 attribute 的 location', () =>
        {
            const aPos = vec2(attribute('aPos'));
            vec4(attribute('aColor'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toContain('@location(0) aPos: vec2<f32>');
        });

        it('应该能够自动分配 varying 的 location', () =>
        {
            const vColor = vec4(varying('vColor'));
            const vTexCoord = vec2(varying('vTexCoord'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('@location(0) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(1) vTexCoord: vec2<f32>');
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const aPos = vec2(attribute('aPos', 2)); // 显式指定 location 2
            const aColor = vec4(attribute('aColor')); // 自动分配
            const vColor = vec4(varying('vColor', 1)); // 显式指定 location 1
            const vTexCoord = vec2(varying('vTexCoord')); // 自动分配

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(aPos, 0.0, 1.0));
                vColor.assign(aColor);
                vTexCoord.assign(vec2(0.0, 0.0));
            });

            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            expect(wgsl).toContain('@location(1) vColor: vec4<f32>');
            expect(wgsl).toContain('@location(0) vTexCoord: vec2<f32>');
            expect(wgsl).toContain('@location(2) aPos: vec2<f32>');
        });
    });

    describe('convertDepth 深度转换', () =>
    {
        it('不使用 convertDepth 时，position 赋值应该保持原样', () =>
        {
            const position = vec4(attribute('position'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(position);
            });

            const wgsl = vert.toWGSL();
            expect(wgsl).toContain('output.position = position;');
            expect(wgsl).not.toContain('_pos_temp');
        });

        it('使用 convertDepth: true 时，应该自动转换深度值', () =>
        {
            const position = vec4(attribute('position'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(position);
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // 验证深度转换代码生成（原地转换 output.position）
            expect(wgsl).toContain('output.position = position;');
            expect(wgsl).toContain('output.position = vec4<f32>(output.position.xy, (output.position.z + 1.0) * 0.5, output.position.w);');
        });

        it('使用 convertDepth: false 时，应该与默认行为相同', () =>
        {
            const position = vec4(attribute('position'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(position);
            });

            const wgslDefault = vert.toWGSL();
            const wgslExplicitFalse = vert.toWGSL({ convertDepth: false });
            expect(wgslDefault).toBe(wgslExplicitFalse);
        });

        it('深度转换应该正确处理复杂表达式', () =>
        {
            const pos = vec2(attribute('pos'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(pos, 0.0, 1.0));
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // 验证复杂表达式也能正确处理（先赋值再原地转换）
            expect(wgsl).toContain('output.position = vec4<f32>(pos, 0.0, 1.0);');
            expect(wgsl).toContain('output.position = vec4<f32>(output.position.xy, (output.position.z + 1.0) * 0.5, output.position.w);');
        });

        it('深度转换不应影响非 position 的赋值', () =>
        {
            const color = vec4(attribute('color'));
            const vColor = vec4(varying('vColor'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(1.0, 0.0, 0.0, 1.0));
                vColor.assign(color);
            });

            const wgsl = vert.toWGSL({ convertDepth: true });
            // position 赋值应该有深度转换
            expect(wgsl).toContain('output.position = vec4<f32>(output.position.xy, (output.position.z + 1.0) * 0.5, output.position.w);');
            // color 赋值不应该有深度转换
            expect(wgsl).toContain('output.vColor = color;');
        });

        it('GLSL 输出不应受 convertDepth 影响', () =>
        {
            const position = vec4(attribute('position'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(position);
            });

            const glsl = vert.toGLSL(2);
            // GLSL 不需要深度转换，应该保持原样
            expect(glsl).toContain('gl_Position = position;');
            expect(glsl).not.toContain('_pos_temp');
        });
    });

    describe('gl_Position 和 varying 结合使用', () =>
    {
        it('应该自动生成包含 position builtin 和 varying 的 VertexOutput', () =>
        {
            const aVertexPosition = vec3(attribute('aVertexPosition'));
            const aTextureCoord = vec2(attribute('aTextureCoord'));
            const uModelViewMatrix = mat4(uniform('uModelViewMatrix'));
            const uProjectionMatrix = mat4(uniform('uProjectionMatrix'));

            const vTextureCoord = vec2(varying('vTextureCoord'));

            const vert = vertex('main', () =>
            {
                const position = var_('position', vec4(aVertexPosition, 1.0));
                gl_Position.assign(uProjectionMatrix.multiply(uModelViewMatrix).multiply(position));
                vTextureCoord.assign(aTextureCoord);
            });

            const wgsl = vert.toWGSL();

            // 验证结构体定义包含 position builtin
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            // 验证 varying 字段也在结构体中
            expect(wgsl).toContain('@location(0) vTextureCoord: vec2<f32>');
            // 验证 gl_Position 的赋值使用结构体字段
            expect(wgsl).toContain('output.position = uProjectionMatrix * uModelViewMatrix * position');
            // 验证 varying 的赋值也使用结构体字段
            expect(wgsl).toContain('output.vTextureCoord = aTextureCoord');
            // 验证返回结构体
            expect(wgsl).toContain('return output;');
        });

        it('只使用 gl_Position 时也应该生成 VertexOutput', () =>
        {
            const aVertexPosition = vec3(attribute('aVertexPosition'));

            const vert = vertex('main', () =>
            {
                gl_Position.assign(vec4(aVertexPosition, 1.0));
            });

            const wgsl = vert.toWGSL();

            // 验证生成了 VertexOutput
            expect(wgsl).toContain('struct VertexOutput');
            // 验证只有一个 position builtin 字段
            expect(wgsl).toContain('@builtin(position) position: vec4<f32>');
            // 验证使用 output.position 进行赋值
            expect(wgsl).toContain('output.position =');
        });
    });
});
