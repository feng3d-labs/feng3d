import { describe, expect, it } from 'vitest';
import { float, Float } from '../../src/types/scalar/float';
import { vec3, Vec3 } from '../../src/types/vector/vec3';
import { vec4, Vec4 } from '../../src/types/vector/vec4';
import { vertex } from '../../src/shader/vertex';
import { gl_Position } from '../../src/glsl/builtin/builtins';
import { var_ } from '../../src/variables/var';
import { Mat4, mat4 } from '../../src/types/matrix/mat4';

describe('var_', () =>
{
    describe('var_<T extends ShaderValue>(name: string, expr: T): T', () =>
    {
        it('应该能够创建 Float 类型的变量', () =>
        {
            vertex('main', () =>
            {
                const myFloat = var_('myFloat', float(1.5));
                expect(myFloat).toBeInstanceOf(Float);
                expect(myFloat.toGLSL()).toBe('myFloat');
                expect(myFloat.toWGSL()).toBe('myFloat');
            });
        });

        it('应该能够创建 Vec3 类型的变量', () =>
        {
            vertex('main', () =>
            {
                const myVec3 = var_('myVec3', vec3(1.0, 2.0, 3.0));
                expect(myVec3).toBeInstanceOf(Vec3);
                expect(myVec3.toGLSL()).toBe('myVec3');
                expect(myVec3.toWGSL()).toBe('myVec3');
            });
        });

        it('应该能够创建 Vec4 类型的变量', () =>
        {
            vertex('main', () =>
            {
                const myVec4 = var_('myVec4', vec4(1.0, 2.0, 3.0, 4.0));
                expect(myVec4).toBeInstanceOf(Vec4);
                expect(myVec4.toGLSL()).toBe('myVec4');
                expect(myVec4.toWGSL()).toBe('myVec4');
            });
        });
    });

    describe('var_<T>(name: string, type: (...args) => T): T', () =>
    {
        it('应该能够使用类型构造函数声明未初始化的变量', () =>
        {
            const shader = vertex('main', () =>
            {
                const a = var_('a', float);
                const b = var_('b', vec3);
                const c = var_('c', mat4);

                expect(a).toBeInstanceOf(Float);
                expect(b).toBeInstanceOf(Vec3);
                expect(c).toBeInstanceOf(Mat4);
            });

            const glsl = shader.toGLSL();
            expect(glsl).toContain('float a;');
            expect(glsl).toContain('vec3 b;');
            expect(glsl).toContain('mat4 c;');

            const wgsl = shader.toWGSL();
            expect(wgsl).toContain('var a: f32;');
            expect(wgsl).toContain('var b: vec3<f32>;');
            expect(wgsl).toContain('var c: mat4x4<f32>;');
        });
    });

    describe('var_(name: string, expr: number): Float', () =>
    {
        it('应该能够从数字创建 Float 变量', () =>
        {
            vertex('main', () =>
            {
                const myFloat = var_('myFloat', 2.5);
                expect(myFloat).toBeInstanceOf(Float);
                expect(myFloat.toGLSL()).toBe('myFloat');
                expect(myFloat.toWGSL()).toBe('myFloat');
            });
        });
    });

    describe('在着色器中使用', () =>
    {
        it('应该在 GLSL 中生成正确的变量声明', () =>
        {
            const shader = vertex('main', () =>
            {
                const pos = var_('pos', vec4(1.0, 2.0, 3.0, 1.0));
                gl_Position.assign(pos);
            });

            const glsl = shader.toGLSL();
            expect(glsl).toContain('vec4 pos = vec4(1.0, 2.0, 3.0, 1.0);');
            expect(glsl).toContain('gl_Position = pos;');
        });

        it('应该在 WGSL 中生成正确的变量声明', () =>
        {
            const shader = vertex('main', () =>
            {
                const pos = var_('pos', vec4(1.0, 2.0, 3.0, 1.0));
                gl_Position.assign(pos);
            });

            const wgsl = shader.toWGSL();
            expect(wgsl).toContain('var pos = vec4<f32>(1.0, 2.0, 3.0, 1.0);');
        });

        it('应该支持表达式作为初始值', () =>
        {
            const shader = vertex('main', () =>
            {
                const a = var_('a', float(1.0));
                const b = var_('b', float(2.0));
                const sum = var_('sum', a.add(b));
                gl_Position.assign(vec4(sum, 0.0, 0.0, 1.0));
            });

            const glsl = shader.toGLSL();
            expect(glsl).toContain('float a = 1.0;');
            expect(glsl).toContain('float b = 2.0;');
            expect(glsl).toContain('float sum = a + b;');
        });
    });
});
