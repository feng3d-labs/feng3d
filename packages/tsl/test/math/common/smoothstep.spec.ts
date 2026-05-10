import { describe, expect, it } from 'vitest';
import { smoothstep } from '../../../src/math/common/smoothstep';
import { float } from '../../../src/types/scalar/float';

describe('smoothstep', () =>
{
    it('应该生成正确的 GLSL 代码（全部 Float）', () =>
    {
        const edge0 = float(0.0);
        const edge1 = float(1.0);
        const x = float(0.5);
        const result = smoothstep(edge0, edge1, x);

        expect(result.toGLSL()).toBe('smoothstep(0.0, 1.0, 0.5)');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const edge0 = float(0.0);
        const edge1 = float(1.0);
        const x = float(0.5);
        const result = smoothstep(edge0, edge1, x);

        expect(result.toWGSL()).toBe('smoothstep(0.0, 1.0, 0.5)');
    });

    it('应该支持全部 number 参数', () =>
    {
        const result = smoothstep(0.0, 1.0, 0.5);

        expect(result.toGLSL()).toBe('smoothstep(0.0, 1.0, 0.5)');
        expect(result.toWGSL()).toBe('smoothstep(0.0, 1.0, 0.5)');
    });

    it('应该支持混合参数', () =>
    {
        const x = float(0.5);
        const result = smoothstep(0.0, 1.0, x);

        expect(result.toGLSL()).toBe('smoothstep(0.0, 1.0, 0.5)');
    });

    it('应该正确跟踪依赖', () =>
    {
        const edge0 = float(0.0);
        const edge1 = float(1.0);
        const x = float(0.5);
        const result = smoothstep(edge0, edge1, x);

        expect(result.dependencies).toContain(edge0);
        expect(result.dependencies).toContain(edge1);
        expect(result.dependencies).toContain(x);
    });

    it('number 参数不应加入依赖', () =>
    {
        const result = smoothstep(0.0, 1.0, 0.5);

        expect(result.dependencies).toEqual([]);
    });
});

