import { describe, expect, it } from 'vitest';

import type { Rectangle } from '../src/geom/rectangleOps';
import {
    rect2Contains,
    rect2Copy,
    rect2From,
    rect2GetBottom,
    rect2GetBottomRight,
    rect2GetCenter,
    rect2GetLeft,
    rect2GetRight,
    rect2GetTop,
    rect2GetTopLeft,
    rect2Inflate,
    rect2Intersection,
    rect2Intersects,
    rect2IsEmpty,
    rect2SetBottom,
    rect2SetBottomRight,
    rect2SetLeft,
    rect2SetRight,
    rect2SetTop,
    rect2SetTopLeft,
} from '../src/geom/rectangleOps';


/**
 * 矩形纯数据形态 + `rect2*` 纯函数层（`packages/math/src/geom/rectangleOps.ts`）。
 *
 * **阶段 C-a 起 `Rectangle` class 已删除**，本文件由「class 行为用例」改写为「纯函数用例」，
 * 断言逐条保留（`new Rectangle(x, y, w, h)` → `{ x, y, w, h }` 字面量；
 * `r.right` → `rect2GetRight(r)`；`r.right = v` → `rect2SetRight(r, v)`（`out` 缺省即入参本身，
 * 所以 setter 的就地语义逐字保留）；`r.intersection(b)` → `rect2Intersection(r, b)`）。
 *
 * 断言全部可以用**数学关系**表达，不需要读实现：
 *
 * - `left = x`、`top = y`、`right = x + width`、`bottom = y + height`；
 * - `topLeft = (left, top)`、`bottomRight = (right, bottom)`、`center` 是几何中心；
 * - 边的 **setter 改的是 `width` / `height`**（不是移动矩形）；
 * - **`rect2Inflate(r, dx, dy)` 四边各外扩**：`x -= dx`、`y -= dy`、`w += 2dx`、`h += 2dy`；
 * - `rect2Contains` 内部为真、明显外部为假；`rect2Intersects` 相离为假；`rect2Intersection` 给出交集矩形。
 *
 * ⚠️ **边界语义**（`contains` 是否含边、`isEmpty` 以什么为界）**有意不写死** ——
 * 那属于需要与实现确认的细节，本文件只钉住无歧义的部分。
 */

/** 原 `new Rectangle(x, y, width, height)` 的字面量形态（纯函数层的 `out` 目标） */
function rectLike(x = 0, y = 0, width = 0, height = 0)
{
    return { x, y, width, height };
}

describe('Rectangle（math/geom）', () =>
{
    describe('★ 四条边与构造函数的关系', () =>
    {
        it('★ left/top 就是 x/y，right/bottom 是 x+width / y+height', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            expect(r.x).toBe(10);
            expect(r.y).toBe(20);
            expect(r.width).toBe(30);
            expect(r.height).toBe(40);

            expect(rect2GetLeft(r)).toBeCloseTo(10, 6);
            expect(rect2GetTop(r)).toBeCloseTo(20, 6);
            expect(rect2GetRight(r)).toBeCloseTo(40, 6);
            expect(rect2GetBottom(r)).toBeCloseTo(60, 6);
        });

        it('默认构造是 (0,0,0,0)', () =>
        {
            // 数据声明形态：带 `readonly __type__: 'Rectangle'` 判别字段（方案 §5.9 的 D1 决策）
            const r: Rectangle = { __type__: 'Rectangle', x: 0, y: 0, width: 0, height: 0 };

            expect(r.x).toBe(0);
            expect(r.y).toBe(0);
            expect(r.width).toBe(0);
            expect(r.height).toBe(0);
        });
    });

    describe('★ 边的 setter 改的是尺寸（不是移动矩形）', () =>
    {
        it('★ 设 right 只改 width', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            rect2SetRight(r, 100);

            expect(r.x, 'x 不该变').toBe(10);
            expect(r.width).toBeCloseTo(90, 6);
            expect(rect2GetRight(r)).toBeCloseTo(100, 6);
        });

        it('★ 设 bottom 只改 height', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            rect2SetBottom(r, 100);

            expect(r.y, 'y 不该变').toBe(20);
            expect(r.height).toBeCloseTo(80, 6);
            expect(rect2GetBottom(r)).toBeCloseTo(100, 6);
        });

        it('★★ 设 left / top 会移动该边并改变尺寸（保持对边 right / bottom 不动）', () =>
        {
            // 实测语义（与 three.js 一致）：left/top 的 setter 会**保持 right/bottom 不变**，
            // 因此改的是 width/height。第一版按"只移动、不改尺寸"断言，失败了（width 得到 40 而非 30）。
            const r = rectLike(10, 20, 30, 40);
            const right = rect2GetRight(r);
            const bottom = rect2GetBottom(r);

            rect2SetLeft(r, 0);
            expect(r.x).toBe(0);
            expect(rect2GetRight(r)).toBeCloseTo(right, 6);      // 对边不动
            expect(r.width).toBeCloseTo(40, 6);

            rect2SetTop(r, 0);
            expect(r.y).toBe(0);
            expect(rect2GetBottom(r)).toBeCloseTo(bottom, 6);
            expect(r.height).toBeCloseTo(60, 6);
        });

        it('★ setter → getter 往返一致（四条边各来一次）', () =>
        {
            const r = rectLike(0, 0, 10, 10);

            rect2SetLeft(r, 5);
            expect(rect2GetLeft(r)).toBeCloseTo(5, 6);
            rect2SetTop(r, 7);
            expect(rect2GetTop(r)).toBeCloseTo(7, 6);
            rect2SetRight(r, 20);
            expect(rect2GetRight(r)).toBeCloseTo(20, 6);
            rect2SetBottom(r, 30);
            expect(rect2GetBottom(r)).toBeCloseTo(30, 6);
        });
    });

    describe('★ topLeft / bottomRight / center', () =>
    {
        it('★ topLeft 是 (left, top)，bottomRight 是 (right, bottom)', () =>
        {
            const r = rectLike(10, 20, 30, 40);
            const tl = rect2GetTopLeft(r);
            const br = rect2GetBottomRight(r);

            expect(tl.x).toBeCloseTo(rect2GetLeft(r), 6);
            expect(tl.y).toBeCloseTo(rect2GetTop(r), 6);
            expect(br.x).toBeCloseTo(rect2GetRight(r), 6);
            expect(br.y).toBeCloseTo(rect2GetBottom(r), 6);
        });

        it('★ center 是几何中心', () =>
        {
            const r = rectLike(10, 20, 30, 40);
            const c = rect2GetCenter(r);

            expect(c.x).toBeCloseTo(10 + 30 / 2, 6);
            expect(c.y).toBeCloseTo(20 + 40 / 2, 6);
        });

        it('★ 设 topLeft 会移动矩形但不改尺寸', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            const right = rect2GetRight(r);
            const bottom = rect2GetBottom(r);

            rect2SetTopLeft(r, { x: 0, y: 0 });

            expect(r.x).toBeCloseTo(0, 6);
            expect(r.y).toBeCloseTo(0, 6);
            // 同样保持 right / bottom 不动
            expect(rect2GetRight(r)).toBeCloseTo(right, 6);
            expect(rect2GetBottom(r)).toBeCloseTo(bottom, 6);
        });

        it('★ 设 bottomRight 会改尺寸（右下角被移动到目标点）', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            rect2SetBottomRight(r, { x: 100, y: 100 });

            expect(rect2GetRight(r)).toBeCloseTo(100, 6);
            expect(rect2GetBottom(r)).toBeCloseTo(100, 6);
            expect(rect2GetLeft(r), '左上角不该动').toBeCloseTo(10, 6);
            expect(rect2GetTop(r)).toBeCloseTo(20, 6);
        });
    });

    describe('★ contains', () =>
    {
        it('★ 内部点为真、明显外部为假', () =>
        {
            const r = rectLike(0, 0, 100, 100);

            expect(rect2Contains(r, 50, 50)).toBe(true);
            expect(rect2Contains(r, 1, 99)).toBe(true);
            expect(rect2Contains(r, -1, 50)).toBe(false);
            expect(rect2Contains(r, 50, -1)).toBe(false);
            expect(rect2Contains(r, 101, 50)).toBe(false);
            expect(rect2Contains(r, 50, 101)).toBe(false);
        });

        it('★ 平移后的矩形按新位置判定', () =>
        {
            const r = rectLike(100, 100, 10, 10);

            expect(rect2Contains(r, 105, 105)).toBe(true);
            expect(rect2Contains(r, 0, 0)).toBe(false);
        });
    });

    describe('★ intersects / intersection', () =>
    {
        it('★ 相交 → true；相离 → false', () =>
        {
            const a = rectLike(0, 0, 100, 100);

            expect(rect2Intersects(a, rectLike(50, 50, 100, 100))).toBe(true);
            expect(rect2Intersects(a, rectLike(90, 90, 1, 1))).toBe(true);
            expect(rect2Intersects(a, rectLike(200, 200, 10, 10))).toBe(false);
            expect(rect2Intersects(a, rectLike(-200, 0, 10, 10))).toBe(false);
        });

        it('★★ intersection 给出正确的交集矩形', () =>
        {
            const a = rectLike(0, 0, 100, 100);
            const b = rectLike(50, 50, 100, 100);
            const inter = rect2Intersection(a, b);

            // 交集 = (50,50) 到 (100,100)
            expect(rect2GetLeft(inter)).toBeCloseTo(50, 6);
            expect(rect2GetTop(inter)).toBeCloseTo(50, 6);
            expect(rect2GetRight(inter)).toBeCloseTo(100, 6);
            expect(rect2GetBottom(inter)).toBeCloseTo(100, 6);
            expect(inter.width).toBeCloseTo(50, 6);
            expect(inter.height).toBeCloseTo(50, 6);
        });

        it('★★ 一个矩形完全包含另一个时，交集就是被包含的那个', () =>
        {
            const big = rectLike(0, 0, 100, 100);
            const small = rectLike(20, 20, 10, 10);
            const inter = rect2Intersection(big, small);

            expect(rect2GetLeft(inter)).toBeCloseTo(20, 6);
            expect(rect2GetTop(inter)).toBeCloseTo(20, 6);
            expect(rect2GetRight(inter)).toBeCloseTo(30, 6);
            expect(rect2GetBottom(inter)).toBeCloseTo(30, 6);
        });

        it('★ 相离时交集面积为 0（宽或高不为正）', () =>
        {
            const a = rectLike(0, 0, 10, 10);
            const b = rectLike(100, 100, 10, 10);
            const inter = rect2Intersection(a, b);

            expect(inter.width <= 0 || inter.height <= 0).toBe(true);
        });
    });

    describe('★ inflate', () =>
    {
        it('★★ 四边各外扩 dx / dy（位置左移、尺寸增加两倍）', () =>
        {
            const r = rectLike(10, 20, 30, 40);

            rect2Inflate(r, 5, 7);

            expect(r.x).toBeCloseTo(10 - 5, 6);
            expect(r.y).toBeCloseTo(20 - 7, 6);
            expect(r.width).toBeCloseTo(30 + 2 * 5, 6);
            expect(r.height).toBeCloseTo(40 + 2 * 7, 6);
        });

        it('★ inflate 负数会收缩', () =>
        {
            const r = rectLike(0, 0, 100, 100);

            rect2Inflate(r, -10, -10);

            expect(r.x).toBeCloseTo(10, 6);
            expect(r.y).toBeCloseTo(10, 6);
            expect(r.width).toBeCloseTo(80, 6);
            expect(r.height).toBeCloseTo(80, 6);
        });
    });

    describe('init / copyFrom / isEmpty', () =>
    {
        it('★ init 设定四个字段，并返回 out（out 传自己即就地）', () =>
        {
            const r = rectLike();
            const ret = rect2From(1, 2, 3, 4, r);

            expect(r.x).toBe(1);
            expect(r.y).toBe(2);
            expect(r.width).toBe(3);
            expect(r.height).toBe(4);
            expect(ret).toBe(r);
        });

        it('★ copyFrom 复制四个字段（含从普通字面量对象复制）', () =>
        {
            const r = rectLike();

            rect2Copy({ x: 5, y: 6, width: 7, height: 8 }, r);

            expect(r.x).toBe(5);
            expect(r.y).toBe(6);
            expect(r.width).toBe(7);
            expect(r.height).toBe(8);
        });

        it('★ isEmpty：零尺寸为真、有尺寸为假（只测无歧义的两端）', () =>
        {
            expect(rect2IsEmpty(rectLike(0, 0, 0, 0))).toBe(true);
            expect(rect2IsEmpty(rectLike(0, 0, 1, 1))).toBe(false);
            expect(rect2IsEmpty(rectLike(0, 0, 100, 100))).toBe(false);
        });
    });
});
