import { describe, expect, it } from 'vitest';
import { attribute, fragment, int, uniform, var_, varying, vertex } from '../../src';
import { gl_FragColor, gl_InstanceID, gl_Position } from '../../src/glsl/builtin/builtins';
import { array, Array as TSLArray } from '../../src/variables/array';
import { Mat4, mat4 } from '../../src/types/matrix/mat4';
import { Vec4, vec4 } from '../../src/types/vector/vec4';
import { vec2 } from '../../src/types/vector/vec2';
import { struct } from '../../src/variables/struct';

describe('Array', () =>
{
    describe('array() 函数', () =>
    {
        it('应该能够使用 mat4 函数创建数组类型', () =>
        {
            const arr = var_('arr', array(mat4(), 2));

            expect(arr).toBeInstanceOf(TSLArray);
            expect(arr.length).toBe(2);
            expect(arr.glslType).toBe('mat4');
            expect(arr.wgslType).toBe('mat4x4<f32>');
        });

        it('应该能够使用 vec4 函数创建数组类型', () =>
        {
            const arr = var_('colors', array(vec4(), 4));

            expect(arr).toBeInstanceOf(TSLArray);
            expect(arr.length).toBe(4);
            expect(arr.glslType).toBe('vec4');
            expect(arr.wgslType).toBe('vec4<f32>');
        });
    });

    describe('Array.index()', () =>
    {
        it('应该能够使用数字索引访问数组元素', () =>
        {
            const arr = var_('arr', array(mat4(), 2));

            expect(arr.index(0)).toBeInstanceOf(Mat4);
            expect(arr.index(1)).toBeInstanceOf(Mat4);
            expect(arr.index(0).toGLSL()).toBe('arr[0]');
            expect(arr.index(1).toGLSL()).toBe('arr[1]');
            expect(arr.index(0).toWGSL()).toBe('arr[0]');
            expect(arr.index(1).toWGSL()).toBe('arr[1]');
        });

        it('应该能够使用 Int 类型索引访问数组元素', () =>
        {
            const arr = var_('arr', array(vec4(), 4));
            const i = uniform('i', int());

            const element = arr.index(i);

            expect(element).toBeInstanceOf(Vec4);
            expect(element.toGLSL()).toBe('arr[i]');
            expect(element.toWGSL()).toBe('arr[i]');
            expect(element.dependencies).toContain(i);
        });
    });

    describe('在 struct 中使用', () =>
    {
        it('应该能够作为 struct 成员使用', () =>
        {
            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });

            const transform = uniform('transform', Transform);

            expect(transform.MVP).toBeInstanceOf(TSLArray);
            expect(transform.MVP.index(0).toGLSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(0).toWGSL()).toBe('transform.MVP[0]');
            expect(transform.MVP.index(1).toGLSL()).toBe('transform.MVP[1]');
            expect(transform.MVP.index(1).toWGSL()).toBe('transform.MVP[1]');
        });
    });

    describe('着色器代码生成', () =>
    {
        it('应该在顶点着色器中生成正确的数组声明', () =>
        {
            const shader = vertex('main', () =>
            {
                const positions = var_('positions', array(vec4(), 3));
                gl_Position.assign(positions.index(0));
            });

            const glsl = shader.toGLSL();
            expect(glsl).toContain('vec4 positions[3];');
            expect(glsl).toContain('gl_Position = positions[0];');

            const wgsl = shader.toWGSL();
            expect(wgsl).toContain('var positions: array<vec4<f32>, 3>;');
        });
    });

    describe('动态索引', () =>
    {
        it('应该支持使用 gl_InstanceID 作为数组索引', () =>
        {
            const pos = attribute('pos', vec2(), 0);

            const Transform = struct('Transform', {
                MVP: array(mat4(), 2),
            });
            const transform = uniform('transform', Transform);

            const vertexShader = vertex('main', () =>
            {
                gl_Position.assign(transform.MVP.index(gl_InstanceID).multiply(vec4(pos, 0.0, 1.0)));
            });

            const glsl = vertexShader.toGLSL(2);
            expect(glsl).toContain('transform.MVP[gl_InstanceID]');

            const wgsl = vertexShader.toWGSL();
            expect(wgsl).toContain('transform.MVP[instanceIndex]');
        });

        it('应该在索引计算中正确处理表达式', () =>
        {
            const Material = struct('Material', {
                Diffuse: array(vec4(), 4),
            });
            const material = uniform('material', Material);

            const instance = varying('instance', int(), { interpolation: 'flat' });

            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(material.Diffuse.index(instance.mod(4)));
            });

            const glsl = fragmentShader.toGLSL(2);
            expect(glsl).toContain('material.Diffuse[instance % 4]');

            const wgsl = fragmentShader.toWGSL();
            expect(wgsl).toContain('material.Diffuse[input.instance % 4]');
        });
    });
});
