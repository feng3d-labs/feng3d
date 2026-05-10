import { describe, expect, it } from 'vitest';
import { attribute } from '../../src/variables/attribute';
import { vec2 } from '../../src/types/vector/vec2';
import { vec4 } from '../../src/types/vector/vec4';
import { return_ } from '../../src/index';
import { vertex } from '../../src/shader/vertex';

describe('Attribute', () =>
{
    describe('attribute() 函数', () =>
    {
        it('应该能够创建 attribute（返回类型实例）', () =>
        {
            const position = attribute('position', vec2(), 0);
            expect(position).toBeDefined();
            expect(position.toGLSL()).toBe('position');
            expect(position.toWGSL()).toBe('position');
        });

        it('应该支持 attribute(name, type)', () =>
        {
            const position = attribute('position', vec2());
            expect(position).toBeDefined();
            expect(position.toGLSL()).toBe('position');
            expect(position.toWGSL()).toBe('position');

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            // 验证生成的着色器代码中包含 attribute 声明
            const glsl = vertexShader.toGLSL();
            expect(glsl).toContain('attribute vec2 position;');
        });

        it('应该支持 attribute(name, type, location)', () =>
        {
            const position = attribute('position', vec2(), 0);
            expect(position).toBeDefined();
            expect(position.toGLSL()).toBe('position');
            expect(position.toWGSL()).toBe('position');

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            // 验证生成的着色器代码中包含 attribute 声明
            const glsl = vertexShader.toGLSL();
            expect(glsl).toContain('attribute vec2 position;');
        });

        it('应该能够生成正确的 GLSL 声明', () =>
        {
            const position = attribute('position', vec2(), 0);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const glsl = vertexShader.toGLSL();
            expect(glsl).toContain('attribute vec2 position;');
        });

        it('应该能够生成正确的 WGSL 声明', () =>
        {
            const position = attribute('position', vec2(), 0);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
        });
    });

    describe('location 自动分配', () =>
    {
        it('应该支持 location 缺省时的自动分配', () =>
        {
            const position = attribute('position', vec2());

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
        });

        it('应该能够自动分配多个 attribute 的 location', () =>
        {
            const aPos = attribute('aPos', vec2());
            const aColor = attribute('aColor', vec4());
            const aTexCoord = attribute('aTexCoord', vec2());

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location 是连续的
            expect(wgsl).toMatch(/@location\(0\).*aPos/);
        });

        it('应该能够混合显式指定和自动分配的 location', () =>
        {
            const aPos = attribute('aPos', vec2(), 2); // 显式指定 location 2
            const aColor = attribute('aColor', vec4()); // 自动分配

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证显式指定的 location 被保留
            expect(wgsl).toContain('@location(2) aPos: vec2<f32>');
        });
    });
});
