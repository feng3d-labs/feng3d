import { describe, expect, it } from 'vitest';
import { Float, forRange_, fragment, int, return_, var_, vec4 } from '../src/index';

/**
 * 本批为 TSL 补齐的三项能力（#710 / #711）：for 循环、向量动态索引、f32→i32 转换。
 * 它们原先都缺失，导致蒙皮逻辑无法用 TSL 表达。
 */
describe('TSL 的 for 循环（forRange_）', () =>
{
    it('生成 WGSL 的 for (var i = 0; i < n; i = i + 1)', () =>
    {
        const f = fragment('main', () =>
        {
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                acc.assign(acc.add(vec4(i.toWGSL() === 'i' ? 1.0 : 0.0)));
            });
            return_(acc);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('for (var i = 0; i < 4; i = i + 1) {');
        expect(wgsl).toContain('acc = acc + vec4<f32>(1.0);');
    });

    it('循环体里的语句挂在循环内（缩进一层）', () =>
    {
        const f = fragment('main', () =>
        {
            forRange_('j', 1, 3, () =>
            {
                return_(vec4(0.0));
            });
        });

        expect(f.toWGSL()).toContain('    return vec4<f32>(0.0);');
    });
});

describe('向量动态索引与 f32→i32 转换', () =>
{
    it('vec4 的 index(i) 生成 v[i]（原先只有 swizzle 分量）', () =>
    {
        const f = fragment('main', () =>
        {
            const v = var_('v', vec4(1.0, 2.0, 3.0, 4.0));
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                // 循环变量直接当索引（蒙皮的 skinIndices[i] 就是这个形态）
                acc.assign(vec4(v.index(i), v.index(i), v.index(i), v.index(i)));
            });
            return_(acc);
        });

        const wgsl = f.toWGSL();
        expect(wgsl).toContain('v[i]');
    });

    it('int(f32) 生成 i32(...)', () =>
    {
        const value = new Float(1.0);

        expect(int(value).toWGSL()).toBe('i32(1.0)');
        expect(int(value).toGLSL()).toBe('int(1.0)');
    });
});
