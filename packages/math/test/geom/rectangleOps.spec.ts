import { assert, describe, it } from 'vitest';

import {
    rect2Bottom,
    rect2BottomRight,
    rect2ClampPoint,
    rect2Contains,
    rect2ContainsPoint,
    rect2ContainsRect,
    rect2Copy,
    rect2Equals,
    rect2From,
    rect2GetBottom,
    rect2GetBottomRight,
    rect2GetCenter,
    rect2GetLeft,
    rect2GetRight,
    rect2GetSize,
    rect2GetTop,
    rect2GetTopLeft,
    rect2Inflate,
    rect2InflatePoint,
    rect2Intersection,
    rect2Intersects,
    rect2IsEmpty,
    rect2Left,
    rect2Offset,
    rect2OffsetPoint,
    rect2Right,
    rect2SetBottom,
    rect2SetBottomRight,
    rect2SetEmpty,
    rect2SetLeft,
    rect2SetRight,
    rect2SetTop,
    rect2SetTopLeft,
    rect2ToString,
    rect2Top,
    rect2TopLeft,
    rect2Union,
} from '../../src/geom/rectangle';
import type { RectangleLike } from '../../src/geom/rectangle';

/**
 * 只取 x / y 两个分量（不依赖 Vector2 的自有属性）。
 */
function xy(v: { x: number; y: number }): { x: number; y: number }
{
    return { x: v.x, y: v.y };
}

/**
 * 只取矩形四个字段（纯数据形状只有这四个字段，不再有 class 自有属性）。
 */
function xywh(r: RectangleLike): { x: number; y: number; width: number; height: number }
{
    return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/**
 * `rectangle` 纯函数层的**契约测试**（issue #134 阶段 A2m）。
 *
 * ## 为什么期望值一律手算硬编码
 *
 * 阶段 A2m 时 class 的方法已经**委托给本文件要测的这些函数**，所以「拿 class 当正确性基准」是无效的：
 * 两边会一起错（方案 §10.1 的 P3 已实测），因此期望值一律手算后硬编码。
 * **阶段 C-a 删掉 `Rectangle` class 后，原先那条「class 委托的接线」用例一并删除**——
 * 委托方已不存在，手算用例就是唯一的等价网（方案 §5.8）。
 *
 * ## getter / setter 是本文件与 `vector2` 最大的不同
 *
 * `right` / `bottom` / `left` / `top` / `topLeft` / `bottomRight` / `center` 这些成员**不是**简单字段读写：
 *
 * - `set right` 只改 `width`，`set bottom` 只改 `height`；
 * - `set left` / `set top` **同时改位置与尺寸**（保持对边不动）；
 * - `set topLeft` 保持 `right` / `bottom` 不动，`set bottomRight` 只改尺寸。
 *
 * 这些语义一旦被"想当然"地写成 `out.x = value`，测 100×100 这类整数矩形看不出来，
 * 所以下面每个 setter 都有**独立的手算用例**（含「对边不动」的断言）。
 *
 * ## 边界语义：`contains` 与 `containsPoint` 有意不同
 *
 * `contains` 用 `<=` / `>=`（**闭区间**，边上的点算包含），`containsPoint` 用 `<` / `>`
 * （**开区间**，边上的点算不包含）。这条差异被下面两条用例分别钉住。
 */
describe('rectangle 纯函数层（#134 阶段 A2m）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = { x: 10, y: 20, width: 30, height: 40 };
        const b = { x: 5, y: 6, width: 7, height: 19 };
        const out = { x: 0, y: 0, width: 0, height: 0 };

        rect2Intersection(a, b, out);

        // 手算：x = max(10,5) = 10、right = min(40,12) = 12 → width = 2；
        //       y = max(20,6) = 20、bottom = min(60,25) = 25 → height = 5
        assert.deepEqual(xywh(out), { x: 10, y: 20, width: 2, height: 5 });
        assert.deepEqual(xywh(a), { x: 10, y: 20, width: 30, height: 40 }, '入参 a 被修改了');
        assert.deepEqual(xywh(b), { x: 5, y: 6, width: 7, height: 19 }, '入参 b 被修改了');
    });

    it('out 缺省时新建普通字面量（初值与默认矩形 (0,0,0,0) 一致）', () =>
    {
        const a = { x: 1, y: 2, width: 3, height: 4 };

        const r = rect2Copy(a);

        assert.deepEqual(xywh(r), { x: 1, y: 2, width: 3, height: 4 });
        assert.deepEqual(xywh(a), { x: 1, y: 2, width: 3, height: 4 });
        // 返回的是新建字面量，不是入参本身
        assert.notEqual(r, a);
    });

    it('★ 回归：set 系列就地调用（out 与 a 同一对象）跨字段读入参', () =>
    {
        // setLeft：width 依赖旧 x，写成「先 out.x = value 再算 width」会得到 70（30 + 0 - 0）
        const left = { x: 10, y: 20, width: 30, height: 40 };

        rect2SetLeft(left, 5, left);
        assert.deepEqual(xywh(left), { x: 5, y: 20, width: 35, height: 40 }, 'left 就地：width 必须用旧 x 算');

        // setTop 同理
        const top = { x: 10, y: 20, width: 30, height: 40 };

        rect2SetTop(top, 5, top);
        assert.deepEqual(xywh(top), { x: 10, y: 5, width: 30, height: 55 });

        // setTopLeft：height / width 都依赖旧值
        const tl = { x: 10, y: 20, width: 30, height: 40 };

        rect2SetTopLeft(tl, { x: 5, y: 5 }, tl);
        assert.deepEqual(xywh(tl), { x: 5, y: 5, width: 35, height: 55 });

        // inflate：四个字段全部依赖旧值
        const inf = { x: 10, y: 20, width: 30, height: 40 };

        rect2Inflate(inf, 5, 7, inf);
        assert.deepEqual(xywh(inf), { x: 5, y: 13, width: 40, height: 54 });

        // offset：x / y 依赖旧值，尺寸原样保留
        const off = { x: 10, y: 20, width: 30, height: 40 };

        rect2Offset(off, 5, 7, off);
        assert.deepEqual(xywh(off), { x: 15, y: 27, width: 30, height: 40 });
    });

    it('★ 回归：rect2Union / rect2Intersection 的 out 与入参同一对象', () =>
    {
        // union 就地：l / t 先算，写回后才读 right / bottom 会算错
        const a = { x: 0, y: 0, width: 10, height: 10 };

        rect2Union(a, { x: 5, y: 5, width: 10, height: 10 }, a);
        assert.deepEqual(xywh(a), { x: 0, y: 0, width: 15, height: 15 });

        // union 的 out 与 toUnion 同一对象
        const b = { x: 5, y: 5, width: 10, height: 10 };

        rect2Union({ x: 0, y: 0, width: 10, height: 10 }, b, b);
        assert.deepEqual(xywh(b), { x: 0, y: 0, width: 15, height: 15 });

        // intersection 不相交时 out 必须被写空（class 侧靠这一点保留「返回空矩形」的语义）
        const c = { x: 0, y: 0, width: 10, height: 10 };

        rect2Intersection(c, { x: 100, y: 100, width: 1, height: 1 }, c);
        assert.deepEqual(xywh(c), { x: 0, y: 0, width: 0, height: 0 });
    });

    it('getter：right = x+width、bottom = y+height、left = x、top = y', () =>
    {
        const a = { x: 10, y: 20, width: 30, height: 40 };

        assert.equal(rect2GetRight(a), 40);
        assert.equal(rect2GetBottom(a), 60);
        assert.equal(rect2GetLeft(a), 10);
        assert.equal(rect2GetTop(a), 20);
    });

    it('★ setter：right 只改 width、bottom 只改 height（位置不动）', () =>
    {
        // 起点 (10,20,30,40)：right = 40
        assert.deepEqual(xywh(rect2SetRight({ x: 10, y: 20, width: 30, height: 40 }, 100)), { x: 10, y: 20, width: 90, height: 40 });
        // 反方向（right 变小 → width 变负）
        assert.deepEqual(xywh(rect2SetRight({ x: 10, y: 20, width: 30, height: 40 }, 25)), { x: 10, y: 20, width: 15, height: 40 });

        // 起点 (10,20,30,40)：bottom = 60
        assert.deepEqual(xywh(rect2SetBottom({ x: 10, y: 20, width: 30, height: 40 }, 100)), { x: 10, y: 20, width: 30, height: 80 });
    });

    it('★★ setter：left / top 同时改位置与尺寸（保持对边不动）', () =>
    {
        // 手算：right 原为 40。left = 0 后 x = 0、width = 40 - 0 = 40
        assert.deepEqual(xywh(rect2SetLeft({ x: 10, y: 20, width: 30, height: 40 }, 0)), { x: 0, y: 20, width: 40, height: 40 });
        // left 右移：x = 25、width = 40 - 25 = 15
        assert.deepEqual(xywh(rect2SetLeft({ x: 10, y: 20, width: 30, height: 40 }, 25)), { x: 25, y: 20, width: 15, height: 40 });

        // 手算：bottom 原为 60。top = 0 后 y = 0、height = 60 - 0 = 60
        assert.deepEqual(xywh(rect2SetTop({ x: 10, y: 20, width: 30, height: 40 }, 0)), { x: 10, y: 0, width: 30, height: 60 });
    });

    it('★★ setTopLeft 保持 right / bottom 不动；setBottomRight 只改尺寸', () =>
    {
        // 起点 (10,20,30,40)：right = 40、bottom = 60
        assert.deepEqual(
            xywh(rect2SetTopLeft({ x: 10, y: 20, width: 30, height: 40 }, { x: 0, y: 0 })),
            { x: 0, y: 0, width: 40, height: 60 });

        // 右下角移到 (100,100)：左上角不动，width = 90、height = 80
        assert.deepEqual(
            xywh(rect2SetBottomRight({ x: 10, y: 20, width: 30, height: 40 }, { x: 100, y: 100 })),
            { x: 10, y: 20, width: 90, height: 80 });
    });

    it('set 系列的 out 可以指向另一个矩形（入参保持只读）', () =>
    {
        const src = { x: 10, y: 20, width: 30, height: 40 };
        const other = { x: 1, y: 2, width: 3, height: 4 };

        rect2SetLeft(src, 0, other);

        assert.deepEqual(xywh(other), { x: 0, y: 20, width: 40, height: 40 });
        assert.deepEqual(xywh(src), { x: 10, y: 20, width: 30, height: 40 }, '入参被修改了');
    });

    it('矩形转点的 getter：topLeft / bottomRight / center / size', () =>
    {
        const a = { x: 10, y: 20, width: 30, height: 40 };

        assert.deepEqual(xy(rect2GetTopLeft(a)), { x: 10, y: 20 });
        assert.deepEqual(xy(rect2GetBottomRight(a)), { x: 40, y: 60 });
        assert.deepEqual(xy(rect2GetCenter(a)), { x: 25, y: 40 }, 'center 手算：(10+15, 20+20)');
        assert.deepEqual(xy(rect2GetSize(a)), { x: 30, y: 40 });
        // 小数中心点
        assert.deepEqual(xy(rect2GetCenter({ x: 0, y: 0, width: 5, height: 7 })), { x: 2.5, y: 3.5 });
    });

    it('★ rect2Right / rect2Bottom / rect2Left / rect2Top / rect2TopLeft / rect2BottomRight 与 Set* 逐字等价', () =>
    {
        // ⚠️ 两组调用都必须各自用**全新的对象**：缺省 out 就是入参矩形本身，
        // 复用同一个对象会让第二组读到第一组已改过的值（初版就踩了这个假失败）。
        const base = () => ({ x: 10, y: 20, width: 30, height: 40 });

        assert.deepEqual(xywh(rect2Right(base(), 100)), xywh(rect2SetRight(base(), 100)));
        assert.deepEqual(xywh(rect2Bottom(base(), 100)), xywh(rect2SetBottom(base(), 100)));
        assert.deepEqual(xywh(rect2Left(base(), 0)), xywh(rect2SetLeft(base(), 0)));
        assert.deepEqual(xywh(rect2Top(base(), 0)), xywh(rect2SetTop(base(), 0)));
        assert.deepEqual(xywh(rect2TopLeft(base(), { x: 1, y: 2 })), xywh(rect2SetTopLeft(base(), { x: 1, y: 2 })));
        assert.deepEqual(xywh(rect2BottomRight(base(), { x: 1, y: 2 })), xywh(rect2SetBottomRight(base(), { x: 1, y: 2 })));
        // 别名同样以「入参矩形」为缺省 out（改的是传进去的那个对象）
        assert.deepEqual(xywh(rect2Right(base(), 100)), { x: 10, y: 20, width: 90, height: 40 });
    });

    it('rect2From / rect2Copy / rect2SetEmpty 手算', () =>
    {
        assert.deepEqual(xywh(rect2From(1, 2, 3, 4)), { x: 1, y: 2, width: 3, height: 4 });
        assert.deepEqual(xywh(rect2Copy({ x: 5, y: 6, width: 7, height: 8 })), { x: 5, y: 6, width: 7, height: 8 });

        const a = { x: 5, y: 6, width: 7, height: 8 };

        rect2SetEmpty(a);
        assert.deepEqual(xywh(a), { x: 0, y: 0, width: 0, height: 0 });
    });

    it('rect2Contains 是闭区间（边上的点算包含）', () =>
    {
        const a = { x: 0, y: 0, width: 100, height: 100 };

        assert.equal(rect2Contains(a, 50, 50), true);
        // 四条边
        assert.equal(rect2Contains(a, 0, 0), true);
        assert.equal(rect2Contains(a, 100, 100), true);
        assert.equal(rect2Contains(a, 0, 50), true);
        assert.equal(rect2Contains(a, 100, 50), true);
        // 界外
        assert.equal(rect2Contains(a, -1, 50), false);
        assert.equal(rect2Contains(a, 101, 50), false);
        assert.equal(rect2Contains(a, 50, -1), false);
        assert.equal(rect2Contains(a, 50, 101), false);
    });

    it('★ rect2ContainsPoint 是开区间（正好落在边上算不包含）——与 rect2Contains 有意不同', () =>
    {
        const a = { x: 0, y: 0, width: 10, height: 10 };

        assert.equal(rect2ContainsPoint(a, { x: 5, y: 5 }), true);
        // 开区间：x = 0 / x = 10 都不算包含（rect2Contains 在同样的点上返回 true）
        assert.equal(rect2ContainsPoint(a, { x: 0, y: 5 }), false);
        assert.equal(rect2ContainsPoint(a, { x: 10, y: 5 }), false);
        assert.equal(rect2ContainsPoint(a, { x: 5, y: 0 }), false);
        assert.equal(rect2ContainsPoint(a, { x: 5, y: 10 }), false);

        assert.equal(rect2Contains(a, 0, 5), true, '闭区间对照');
    });

    it('rect2ContainsRect 手算（完全包含为真、越界为假）', () =>
    {
        const big = { x: 0, y: 0, width: 100, height: 100 };

        assert.equal(rect2ContainsRect(big, { x: 20, y: 20, width: 10, height: 10 }), true);
        assert.equal(rect2ContainsRect(big, { x: 0, y: 0, width: 100, height: 100 }), true);
        // 左上角出界
        assert.equal(rect2ContainsRect(big, { x: -1, y: 0, width: 10, height: 10 }), false);
        // 右下角出界
        assert.equal(rect2ContainsRect(big, { x: 95, y: 95, width: 10, height: 10 }), false);
        // 只测「同一起点、越界右下」这一条含 8 个比较的路径
        assert.equal(rect2ContainsRect(big, { x: 0, y: 0, width: 101, height: 100 }), false);
    });

    it('rect2Intersects 手算（相离为假、仅接触边界为真）', () =>
    {
        const a = { x: 0, y: 0, width: 100, height: 100 };

        assert.equal(rect2Intersects(a, { x: 50, y: 50, width: 100, height: 100 }), true);
        assert.equal(rect2Intersects(a, { x: 90, y: 90, width: 1, height: 1 }), true);
        // 仅接触边界（右边界 == 对方左边界）算相交
        assert.equal(rect2Intersects(a, { x: 100, y: 0, width: 10, height: 10 }), true);
        assert.equal(rect2Intersects(a, { x: 200, y: 200, width: 10, height: 10 }), false);
        assert.equal(rect2Intersects(a, { x: -200, y: 0, width: 10, height: 10 }), false);
        assert.equal(rect2Intersects(a, { x: 0, y: -200, width: 10, height: 10 }), false);
    });

    it('★★ rect2Intersection 手算（相交 / 完全包含 / 相离置空）', () =>
    {
        // (0,0,100,100) ∩ (50,50,100,100)：手算 x = max(0,50) = 50、width = min(100,150) - 50 = 50
        assert.deepEqual(
            xywh(rect2Intersection({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 })),
            { x: 50, y: 50, width: 50, height: 50 });

        // 完全包含 → 交集就是被包含的那个
        assert.deepEqual(
            xywh(rect2Intersection({ x: 0, y: 0, width: 100, height: 100 }, { x: 20, y: 20, width: 10, height: 10 })),
            { x: 20, y: 20, width: 10, height: 10 });

        // 相离 → 全 0（不是保留 out 原值）
        assert.deepEqual(
            xywh(rect2Intersection({ x: 0, y: 0, width: 10, height: 10 }, { x: 100, y: 100, width: 10, height: 10 })),
            { x: 0, y: 0, width: 0, height: 0 });

        // 另一条分支（a.x < toIntersect.x 且宽度被 toIntersect.width 限住）
        assert.deepEqual(
            xywh(rect2Intersection({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 10, height: 10 })),
            { x: 50, y: 50, width: 10, height: 10 });
    });

    it('★ rect2Union 手算（含超大数不做减法、空矩形两条分支）', () =>
    {
        // (0,0,100,100) ∪ (50,50,10,10)：手算 l=0、t=0、right=max(100,60)=100、bottom=100
        assert.deepEqual(
            xywh(rect2Union({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 10, height: 10 })),
            { x: 0, y: 0, width: 100, height: 100 });
        assert.deepEqual(
            xywh(rect2Union({ x: 50, y: 50, width: 10, height: 10 }, { x: 0, y: 0, width: 100, height: 100 })),
            { x: 0, y: 0, width: 100, height: 100 });
        // 双方都有尺寸且互不包含
        assert.deepEqual(
            xywh(rect2Union({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 30, width: 5, height: 5 })),
            { x: 0, y: 0, width: 25, height: 35 });

        // 超大宽高：width 必须是 1e9，不能是 Infinity（「right - l」在 l = 0 时才恰好等于 1e9，
        // 若实现改成 `right + (-l)` 或先减后取 max，这里就会掉到 1e9 - 0 之外的路径）
        assert.deepEqual(
            xywh(rect2Union({ x: 0, y: 0, width: 1e9, height: 1e9 }, { x: 20, y: 20, width: 10, height: 10 })),
            { x: 0, y: 0, width: 1e9, height: 1e9 });
        assert.deepEqual(
            xywh(rect2Union({ x: 1e9, y: 1e9, width: 1e9, height: 1e9 }, { x: 0, y: 0, width: 10, height: 10 })),
            { x: 0, y: 0, width: 2e9, height: 2e9 });

        // toUnion 为空 → 就是 a 的副本（不是空矩形）
        const a = { x: 1, y: 2, width: 3, height: 4 };

        assert.deepEqual(xywh(rect2Union(a, { x: 0, y: 0, width: 0, height: 0 })), { x: 1, y: 2, width: 3, height: 4 });
        // a 为空 → 取 toUnion
        assert.deepEqual(xywh(rect2Union({ x: 0, y: 0, width: 0, height: 0 }, { x: 5, y: 6, width: 7, height: 8 })), { x: 5, y: 6, width: 7, height: 8 });
        // 双方都空 → 全 0
        assert.deepEqual(xywh(rect2Union({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: 0, height: 0 })), { x: 0, y: 0, width: 0, height: 0 });
        // 自己与自己合并（out === a === toUnion）
        const self = { x: 1, y: 2, width: 3, height: 4 };

        rect2Union(self, self, self);
        assert.deepEqual(xywh(self), { x: 1, y: 2, width: 3, height: 4 });
    });

    it('rect2IsEmpty 的边界：宽或高 <= 0 即为空', () =>
    {
        assert.equal(rect2IsEmpty({ x: 0, y: 0, width: 0, height: 10 }), true);
        assert.equal(rect2IsEmpty({ x: 0, y: 0, width: 10, height: 0 }), true);
        assert.equal(rect2IsEmpty({ x: 0, y: 0, width: -1, height: 10 }), true);
        assert.equal(rect2IsEmpty({ x: 0, y: 0, width: 10, height: 10 }), false);
    });

    it('★ rect2Equals 是严格比较：self 恒真（含 NaN）、逐字段 ===', () =>
    {
        const a = { x: 1, y: 2, width: 3, height: 4 };

        assert.equal(rect2Equals(a, { x: 1, y: 2, width: 3, height: 4 }), true);
        assert.equal(rect2Equals(a, { x: 1, y: 2, width: 3, height: 5 }), false);
        assert.equal(rect2Equals(a, a), true);
        // 身份快速通道：self 即便带 NaN 也返回 true（既有行为）
        const nan = { x: NaN, y: 0, width: 0, height: 0 };

        assert.equal(rect2Equals(nan, nan), true, 'self 走身份快速通道');
        assert.equal(rect2Equals(nan, { x: NaN, y: 0, width: 0, height: 0 }), false, '不同对象的 NaN !== NaN');
    });

    it('rect2ClampPoint / rect2InflatePoint / rect2OffsetPoint 手算', () =>
    {
        const a = { x: 0, y: 0, width: 10, height: 10 };

        // 夹取：外部点贴到角上、内部点原样
        assert.deepEqual(xy(rect2ClampPoint(a, { x: 20, y: 20 })), { x: 10, y: 10 });
        assert.deepEqual(xy(rect2ClampPoint(a, { x: -5, y: 5 })), { x: 0, y: 5 });
        assert.deepEqual(xy(rect2ClampPoint(a, { x: 5, y: 5 })), { x: 5, y: 5 });
        // out 传自己（返回的就是出参对象）
        const pout = { x: 0, y: 0 };

        assert.equal(rect2ClampPoint(a, { x: 20, y: 20 }, pout), pout);

        const inflate = { x: 10, y: 20, width: 30, height: 40 };

        rect2InflatePoint(inflate, { x: 5, y: 7 });
        assert.deepEqual(xywh(inflate), { x: 5, y: 13, width: 40, height: 54 });

        const offset = { x: 10, y: 20, width: 30, height: 40 };

        rect2OffsetPoint(offset, { x: 5, y: 7 });
        assert.deepEqual(xywh(offset), { x: 15, y: 27, width: 30, height: 40 });
    });

    it('rect2ToString 手算（分隔符是逗号加空格）', () =>
    {
        assert.equal(rect2ToString({ x: 1, y: 2, width: 3, height: 4 }), '(x=1, y=2, width=3, height=4)');
        assert.equal(rect2ToString({ x: 1.5, y: -2, width: 30, height: 40 }), '(x=1.5, y=-2, width=30, height=40)');
    });

});
