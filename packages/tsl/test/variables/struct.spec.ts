import { describe, expect, it } from 'vitest';
import { attribute, fragment, gl_FragColor, gl_Position, int, uniform, varying, vec2, vertex } from '../../src';
import { array, Array as TSLArray } from '../../src/variables/array';
import { mat4 } from '../../src/types/matrix/mat4';
import { Vec4, vec4 } from '../../src/types/vector/vec4';
import { struct, Struct } from '../../src/variables/struct';

describe('Struct', () =>
{
    describe('struct() 函数', () =>
    {
        it('应该能够创建简单结构体', () =>
        {
            const Material = struct('Material', {
                color: vec4(),
            });

            expect(typeof Material).toBe('object');
            expect(Material._definition).toBeDefined();
        });

        it('应该能够创建包含多个成员的结构体', () =>
        {
            const Transform = struct('Transform', {
                model: mat4(),
                view: mat4(),
                projection: mat4(),
            });

            expect(typeof Transform).toBe('object');
            expect(Transform._definition).toBeDefined();
        });

        it('应该能够创建包含数组成员的结构体', () =>
        {
            const Lights = struct('Lights', {
                positions: array(vec4(), 4),
                colors: array(vec4(), 4),
            });

            expect(typeof Lights).toBe('object');
            expect(Lights._definition).toBeDefined();
        });
    });

    describe('Struct 实例', () =>
    {
        it('应该能够通过 uniform 创建结构体实例', () =>
        {
            const Material = struct('Material', {
                color: vec4(),
            });

            const material = uniform('material', Material);

            expect(material instanceof Struct).toBe(true);
            expect(material.color instanceof Vec4).toBe(true);
        });

        it('应该能够访问简单成员', () =>
        {
            const Material = struct('Material', {
                color: vec4(),
                ambient: vec4(),
            });

            const material = uniform('material', Material);

            expect(material.color.toGLSL()).toBe('material.color');
            expect(material.color.toWGSL()).toBe('material.color');
            expect(material.ambient.toGLSL()).toBe('material.ambient');
            expect(material.ambient.toWGSL()).toBe('material.ambient');
        });

        it('应该能够访问数组成员', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });

            const transform = uniform('transform', Transform);

            expect(transform.MVP instanceof TSLArray).toBe(true);
            expect(transform.MVP.length).toBe(2);
        });

        it('应该能够通过 index() 访问数组元素', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });

            const transform = uniform('transform', Transform);

            expect(transform.MVP.index(0).toGLSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(0).toWGSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(1).toGLSL()).toBe('transform.MVP[1]');
            expect(transform.MVP.index(1).toWGSL()).toBe('transform.MVP[1]');
        });
    });

    describe('GLSL UBO 生成', () =>
    {
        it('应该在顶点着色器中生成正确的 UBO 声明', () =>
        {
            const pos = attribute('pos', vec2(), 0);

            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });
            const transform = uniform('transform', Transform);

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(transform.MVP.index(0).multiply(vec4(pos, 0.0, 1.0)));
            });

            const glsl = vertexShader.toGLSL(2);

            expect(glsl).toContain('layout(std140, column_major) uniform;');
            expect(glsl).toContain('uniform Transform');
            expect(glsl).toContain('mat4 MVP[2];');
            expect(glsl).toContain('} transform;');
        });

        it('应该在片段着色器中生成正确的 UBO 声明', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 2),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            const glsl = fragmentShader.toGLSL(2);

            expect(glsl).toContain('uniform Material');
            expect(glsl).toContain('vec4 Diffuse[2];');
            expect(glsl).toContain('} material;');
        });
    });

    describe('WGSL 结构体生成', () =>
    {
        it('应该在顶点着色器中生成正确的 WGSL 结构体', () =>
        {
            const pos = attribute('pos', vec2(), 0);

            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });
            const transform = uniform('transform', Transform);

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(transform.MVP.index(0).multiply(vec4(pos, 0.0, 1.0)));
            });

            const wgsl = vertexShader.toWGSL();

            expect(wgsl).toContain('struct Transform');
            expect(wgsl).toContain('MVP: array<mat4x4<f32>, 2>');
            expect(wgsl).toContain('@group(0) @binding(0) var<uniform> transform: Transform;');
        });

        it('应该在片段着色器中生成正确的 WGSL 结构体', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 2),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(2)));
            });

            const wgsl = fragmentShader.toWGSL();

            expect(wgsl).toContain('struct Material');
            expect(wgsl).toContain('Diffuse: array<vec4<f32>, 2>');
            expect(wgsl).toMatch(/@group\(0\) @binding\(\d+\) var<uniform> material: Material;/);
        });
    });
});
