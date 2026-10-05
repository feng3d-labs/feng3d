import { describe, expect, it } from 'vitest';
import { gl_FragCoord, gl_FrontFacing, gl_InstanceID, gl_Position, gl_VertexID } from '../../src/glsl/builtin/builtins';
import { int } from '../../src/types/scalar/int';

describe('预定义 Builtins', () =>
{
    describe('gl_Position', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_Position.toGLSL()).toBe('gl_Position');
        });
    });

    describe('gl_VertexID', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            // gl_VertexID 在 GLSL 中是 int 类型，可以直接作为数组索引使用
            expect(gl_VertexID.toGLSL()).toBe('gl_VertexID');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            expect(gl_VertexID.toWGSL()).toBe('vertexIndex');
        });
    });

    describe('gl_FragCoord', () =>
    {
        it('gl_FragCoord.x 在 GLSL 和 WGSL 中应该相同', () =>
        {
            const x = gl_FragCoord.x;
            expect(x.toGLSL()).toBe('gl_FragCoord.x');
            expect(x.toWGSL()).toBe('fragCoord.x');
        });

        it('gl_FragCoord.y 在 WGSL 中应该翻转（使用负值）', () =>
        {
            const y = gl_FragCoord.y;
            expect(y.toGLSL()).toBe('gl_FragCoord.y');
            expect(y.toWGSL()).toBe('(-fragCoord.y)');
        });
    });

    describe('gl_InstanceID', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            // gl_InstanceID 在 GLSL 中是 int 类型，可以直接作为数组索引使用
            expect(gl_InstanceID.toGLSL()).toBe('gl_InstanceID');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            expect(gl_InstanceID.toWGSL()).toBe('instanceIndex');
        });

        it('int(gl_InstanceID) 在 GLSL 中不需要类型转换', () =>
        {
            // gl_InstanceID 在 GLSL 中本身就是 int 类型，所以不需要 int() 转换
            const instanceInt = int(gl_InstanceID);
            expect(instanceInt.toGLSL()).toBe('gl_InstanceID');
        });

        it('int(gl_InstanceID) 在 WGSL 中需要 i32() 转换', () =>
        {
            // instance_index 在 WGSL 中是 u32 类型，需要转换为 i32
            const instanceInt = int(gl_InstanceID);
            expect(instanceInt.toWGSL()).toBe('i32(instanceIndex)');
        });
    });

    describe('gl_FrontFacing', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            expect(gl_FrontFacing.toGLSL()).toBe('gl_FrontFacing');
        });
    });
});
