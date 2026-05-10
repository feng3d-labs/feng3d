import { describe, expect, it } from 'vitest';
import { ivec3, IVec3 } from '../../../src/types/vector/ivec3';

describe('IVec3', () =>
{
    describe('构造函数', () =>
    {
        it('空构造函数应该返回未初始化的 IVec3', () =>
        {
            const v = ivec3();

            expect(v).toBeInstanceOf(IVec3);
            expect(v.glslType).toBe('ivec3');
            expect(v.wgslType).toBe('vec3<i32>');
        });

        it('应该支持从三个数字构造', () =>
        {
            const v = ivec3(1, 2, 3);

            expect(v.toGLSL()).toBe('ivec3(1, 2, 3)');
            expect(v.toWGSL()).toBe('vec3<i32>(1, 2, 3)');
            expect(v.dependencies).toEqual([]);
        });
    });

    describe('分量访问', () =>
    {
        it('应该能够访问 x 分量', () =>
        {
            const v = ivec3(1, 2, 3);
            const x = v.x;

            expect(x.toGLSL()).toBe('ivec3(1, 2, 3).x');
            expect(x.toWGSL()).toBe('vec3<i32>(1, 2, 3).x');
            expect(x.dependencies).toContain(v);
        });

        it('应该能够访问 y 分量', () =>
        {
            const v = ivec3(1, 2, 3);
            const y = v.y;

            expect(y.toGLSL()).toBe('ivec3(1, 2, 3).y');
            expect(y.toWGSL()).toBe('vec3<i32>(1, 2, 3).y');
            expect(y.dependencies).toContain(v);
        });

        it('应该能够访问 z 分量', () =>
        {
            const v = ivec3(1, 2, 3);
            const z = v.z;

            expect(z.toGLSL()).toBe('ivec3(1, 2, 3).z');
            expect(z.toWGSL()).toBe('vec3<i32>(1, 2, 3).z');
            expect(z.dependencies).toContain(v);
        });
    });
});
