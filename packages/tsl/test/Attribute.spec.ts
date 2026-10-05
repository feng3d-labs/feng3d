import { describe, expect, it } from 'vitest';
import { Attribute, attribute } from '../src/variables/attribute';
import { vec2 } from '../src/types/vector/vec2';
import { vec4 } from '../src/types/vector/vec4';
import { return_ } from '../src/index';
import { vertex } from '../src/shader/vertex';

describe('Attribute', () =>
{
    describe('Attribute 类', () =>
    {
        it('应该能够创建 Attribute 实例', () =>
        {
            const attr = new Attribute('position', 0);
            expect(attr.name).toBe('position');
            expect(attr.location).toBe(0);
        });

        it('应该在没有设置 value 时抛出错误', () =>
        {
            const attr = new Attribute('position', 0);
            expect(() => attr.toGLSL()).toThrow(/没有设置 value/);
        });

        it('应该能够设置 value 并生成 GLSL', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = vec2(attribute('position', 0));
            expect(attr.toGLSL()).toBe('attribute vec2 position;');
        });

        it('应该能够生成 WGSL', () =>
        {
            const attr = new Attribute('position', 0);
            attr.value = vec2(attribute('position', 0));
            expect(attr.toWGSL()).toBe('@location(0) position: vec2<f32>');
        });
    });

    describe('attribute() 函数', () =>
    {
        it('应该能够创建 attribute', () =>
        {
            const attr = attribute('position', 0);
            expect(attr).toBeInstanceOf(Attribute);
            expect(attr.name).toBe('position');
            expect(attr.location).toBe(0);
        });

        it('应该支持 vec2(attribute(...)) 形式', () =>
        {
            const position = vec2(attribute('position', 0));
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
    });

    describe('location 自动分配', () =>
    {
        it('应该支持 location 缺省时的自动分配', () =>
        {
            const attr1 = attribute('position');
            const attr2 = attribute('color');
            attr1.value = vec2(attr1);
            attr2.value = vec4(attr2);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(vec2(attr1), 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证自动分配的 location
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
        });

        it('应该能够自动分配多个 attribute 的 location', () =>
        {
            const aPos = vec2(attribute('aPos'));
            vec4(attribute('aColor'));
            vec2(attribute('aTexCoord'));

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
            const aPos = vec2(attribute('aPos', 2)); // 显式指定 location 2
            vec4(attribute('aColor')); // 自动分配

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(aPos, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();
            // 验证显式指定的 location 被保留
            expect(wgsl).toContain('@location(2) aPos: vec2<f32>');
            // 验证自动分配的 location 从 0 开始（因为 2 已被占用）
        });
    });
});

