import { assert, describe, it } from 'vitest';
import { Color4 } from '../src/Color4';
import { color3ToHexString, color3ToVector3 } from '../src/color/color3Ops';
import {
    color4FromUnit,
    color4FromUnit24,
    color4Mix,
    color4Random,
    color4ToArray,
    color4ToHexString,
    color4ToInt,
} from '../src/color/color4Ops';

/**
 * `color3Ops` / `color4Ops` 纯函数层的**契约测试**（issue #134 阶段 A2a）。
 *
 * 与 `vector3Ops.spec.ts` 同样的分工：**数值类期望值手算硬编码**（能发现实现错误），
 * 另设「接线类」用例只对比 class 与纯函数（能发现委托时参数传错）。
 * 拿已委托的 class 当基准是无效的——两边会一起错。
 */
describe('color3Ops / color4Ops 纯函数层（#134 A2a）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = { r: 0, g: 0, b: 0, a: 0 };
        const b = { r: 1, g: 1, b: 1, a: 1 };

        const out = color4Mix(a, b, 0.5);

        assert.deepEqual(a, { r: 0, g: 0, b: 0, a: 0 }, '入参 a 被修改了');
        assert.deepEqual(b, { r: 1, g: 1, b: 1, a: 1 }, '入参 b 被修改了');
        assert.deepEqual(out, { r: 0.5, g: 0.5, b: 0.5, a: 0.5 });
    });

    it('out 传自己即就地运算', () =>
    {
        const target = { r: 0, g: 0, b: 0, a: 0 };
        const other = { r: 1, g: 1, b: 1, a: 1 };

        color4Mix(target, other, 0.5, target);

        assert.deepEqual(target, { r: 0.5, g: 0.5, b: 0.5, a: 0.5 });
    });

    it('★ color4Random(false) 不写 a：缺省新建时 a 必须保持 1', () =>
    {
        // 缺省 out 若用 a:0，这里就会与 `new Color4().random(false)`（a 保持 1）不一致
        const c = color4Random(false);

        assert.equal(c.a, 1, `random(false) 不应改动 a，实际得到 ${c.a}`);
        assert.ok(c.r >= 0 && c.r < 1);
        assert.ok(c.g >= 0 && c.g < 1);
        assert.ok(c.b >= 0 && c.b < 1);
    });

    it('★ color4ToHexString 的拼接顺序是 ARGB（手算硬编码）', () =>
    {
        // a=1 → FF, r=1 → FF, g=0 → 00, b=0 → 00；顺序 A R G B
        assert.equal(color4ToHexString({ r: 1, g: 0, b: 0, a: 1 }), '#FFFF0000');

        // a=0 → 00, r=0 → 00, g=1 → FF, b=0 → 00
        assert.equal(color4ToHexString({ r: 0, g: 1, b: 0, a: 0 }), '#0000FF00');
    });

    it('color3ToHexString 与手算一致', () =>
    {
        assert.equal(color3ToHexString({ r: 1, g: 0, b: 0 }), '#FF0000');

        // 0x11/255 ≈ 0.0667 → *255 = 17 → 0x11
        assert.equal(color3ToHexString({ r: 17 / 255, g: 0, b: 0 }), '#110000');
    });

    it('color4FromUnit24 取三分量、a 用参数（手算硬编码）', () =>
    {
        const c = color4FromUnit24(0x123456, 0.5);

        assert.equal(c.r, 18 / 255);
        assert.equal(c.g, 52 / 255);
        assert.equal(c.b, 86 / 255);
        assert.equal(c.a, 0.5);
    });

    it('color4FromUnit 解 0xAARRGGBB 四通道（手算硬编码）', () =>
    {
        const c = color4FromUnit(0x80123456);

        assert.equal(c.a, 128 / 255);
        assert.equal(c.r, 18 / 255);
        assert.equal(c.g, 52 / 255);
        assert.equal(c.b, 86 / 255);
    });

    it('color4ToInt 与手算一致（不取整）', () =>
    {
        assert.equal(color4ToInt({ r: 1, g: 0, b: 0, a: 1 }), 0xFFFF0000 | 0);

        // 与 color3ToInt 同一口径：不取整
        assert.equal(color4ToInt({ r: 0.5, g: 0, b: 0, a: 0 }), (0.5 * 0xff) << 16);
    });

    it('颜色到向量的转换写对分量', () =>
    {
        assert.deepEqual(color3ToVector3({ r: 0.1, g: 0.2, b: 0.3 }), { x: 0.1, y: 0.2, z: 0.3 });
    });

    it('color4ToArray 从 offset 起写四位', () =>
    {
        assert.deepEqual(color4ToArray({ r: 1, g: 2, b: 3, a: 4 }), [1, 2, 3, 4]);
        assert.deepEqual(color4ToArray({ r: 1, g: 2, b: 3, a: 4 }, [9, 9], 1), [9, 1, 2, 3, 4]);
    });

    it('class 委托的接线正确（class 结果 == 纯函数结果）', () =>
    {
        const c4 = new Color4(0.2, 0.4, 0.6, 0.8);

        assert.equal(c4.toHexString(), color4ToHexString(c4));
        assert.equal(c4.toInt(), color4ToInt(c4));
    });
});
