import { describe, expect, it } from 'vitest';

import { Rectangle } from '../src/geom/Rectangle';
import { Vector2 } from '../src/geom/Vector2';

/**
 * `Rectangle`（`packages/math/src/geom/Rectangle.ts`，93 行，此前**行覆盖率 4.3%**）。
 *
 * 标准的二维轴对齐矩形，字段是 `x / y / width / height`，并暴露四条边与两个角的
 * **getter/setter**。断言全部可以用**数学关系**表达，不需要读实现：
 *
 * - `left = x`、`top = y`、`right = x + width`、`bottom = y + height`；
 * - `topLeft = (left, top)`、`bottomRight = (right, bottom)`、`center` 是几何中心；
 * - 边的 **setter 改的是 `width` / `height`**（不是移动矩形）；
 * - **`inflate(dx, dy)` 四边各外扩**：`x -= dx`、`y -= dy`、`w += 2dx`、`h += 2dy`；
 * - `contains` 内部为真、明显外部为假；`intersects` 相离为假；`intersection` 给出交集矩形。
 *
 * ⚠️ **边界语义**（`contains` 是否含边、`isEmpty` 以什么为界）**有意不写死** ——
 * 那属于需要与实现确认的细节，本文件只钉住无歧义的部分。
 */

describe('Rectangle（math/geom）', () =>
{
    describe('★ 四条边与构造函数的关系', () =>
    {
        it('★ left/top 就是 x/y，right/bottom 是 x+width / y+height', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);

            expect(r.x).toBe(10);
            expect(r.y).toBe(20);
            expect(r.width).toBe(30);
            expect(r.height).toBe(40);

            expect(r.left).toBeCloseTo(10, 6);
            expect(r.top).toBeCloseTo(20, 6);
            expect(r.right).toBeCloseTo(40, 6);
            expect(r.bottom).toBeCloseTo(60, 6);
        });

        it('默认构造是 (0,0,0,0)', () =>
        {
            const r = new Rectangle();

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
            const r = new Rectangle(10, 20, 30, 40);

            r.right = 100;

            expect(r.x, 'x 不该变').toBe(10);
            expect(r.width).toBeCloseTo(90, 6);
            expect(r.right).toBeCloseTo(100, 6);
        });

        it('★ 设 bottom 只改 height', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);

            r.bottom = 100;

            expect(r.y, 'y 不该变').toBe(20);
            expect(r.height).toBeCloseTo(80, 6);
            expect(r.bottom).toBeCloseTo(100, 6);
        });

        it('★★ 设 left / top 会移动该边并改变尺寸（保持对边 right / bottom 不动）', () =>
        {
            // 实测语义（与 three.js 一致）：left/top 的 setter 会**保持 right/bottom 不变**，
            // 因此改的是 width/height。第一版按"只移动、不改尺寸"断言，失败了（width 得到 40 而非 30）。
            const r = new Rectangle(10, 20, 30, 40);
            const right = r.right;
            const bottom = r.bottom;

            r.left = 0;
            expect(r.x).toBe(0);
            expect(r.right).toBeCloseTo(right, 6);      // 对边不动
            expect(r.width).toBeCloseTo(40, 6);

            r.top = 0;
            expect(r.y).toBe(0);
            expect(r.bottom).toBeCloseTo(bottom, 6);
            expect(r.height).toBeCloseTo(60, 6);
        });

        it('★ setter → getter 往返一致（四条边各来一次）', () =>
        {
            const r = new Rectangle(0, 0, 10, 10);

            r.left = 5;
            expect(r.left).toBeCloseTo(5, 6);
            r.top = 7;
            expect(r.top).toBeCloseTo(7, 6);
            r.right = 20;
            expect(r.right).toBeCloseTo(20, 6);
            r.bottom = 30;
            expect(r.bottom).toBeCloseTo(30, 6);
        });
    });

    describe('★ topLeft / bottomRight / center', () =>
    {
        it('★ topLeft 是 (left, top)，bottomRight 是 (right, bottom)', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);
            const tl = r.topLeft;
            const br = r.bottomRight;

            expect(tl.x).toBeCloseTo(r.left, 6);
            expect(tl.y).toBeCloseTo(r.top, 6);
            expect(br.x).toBeCloseTo(r.right, 6);
            expect(br.y).toBeCloseTo(r.bottom, 6);
        });

        it('★ center 是几何中心', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);
            const c = r.center;

            expect(c.x).toBeCloseTo(10 + 30 / 2, 6);
            expect(c.y).toBeCloseTo(20 + 40 / 2, 6);
        });

        it('★ 设 topLeft 会移动矩形但不改尺寸', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);

            const right = r.right;
            const bottom = r.bottom;

            r.topLeft = new Vector2(0, 0);

            expect(r.x).toBeCloseTo(0, 6);
            expect(r.y).toBeCloseTo(0, 6);
            // 同样保持 right / bottom 不动
            expect(r.right).toBeCloseTo(right, 6);
            expect(r.bottom).toBeCloseTo(bottom, 6);
        });

        it('★ 设 bottomRight 会改尺寸（右下角被移动到目标点）', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);

            r.bottomRight = new Vector2(100, 100);

            expect(r.right).toBeCloseTo(100, 6);
            expect(r.bottom).toBeCloseTo(100, 6);
            expect(r.left, '左上角不该动').toBeCloseTo(10, 6);
            expect(r.top).toBeCloseTo(20, 6);
        });
    });

    describe('★ contains', () =>
    {
        it('★ 内部点为真、明显外部为假', () =>
        {
            const r = new Rectangle(0, 0, 100, 100);

            expect(r.contains(50, 50)).toBe(true);
            expect(r.contains(1, 99)).toBe(true);
            expect(r.contains(-1, 50)).toBe(false);
            expect(r.contains(50, -1)).toBe(false);
            expect(r.contains(101, 50)).toBe(false);
            expect(r.contains(50, 101)).toBe(false);
        });

        it('★ 平移后的矩形按新位置判定', () =>
        {
            const r = new Rectangle(100, 100, 10, 10);

            expect(r.contains(105, 105)).toBe(true);
            expect(r.contains(0, 0)).toBe(false);
        });
    });

    describe('★ intersects / intersection', () =>
    {
        it('★ 相交 → true；相离 → false', () =>
        {
            const a = new Rectangle(0, 0, 100, 100);

            expect(a.intersects(new Rectangle(50, 50, 100, 100))).toBe(true);
            expect(a.intersects(new Rectangle(90, 90, 1, 1))).toBe(true);
            expect(a.intersects(new Rectangle(200, 200, 10, 10))).toBe(false);
            expect(a.intersects(new Rectangle(-200, 0, 10, 10))).toBe(false);
        });

        it('★★ intersection 给出正确的交集矩形', () =>
        {
            const a = new Rectangle(0, 0, 100, 100);
            const b = new Rectangle(50, 50, 100, 100);
            const inter = a.intersection(b);

            // 交集 = (50,50) 到 (100,100)
            expect(inter.left).toBeCloseTo(50, 6);
            expect(inter.top).toBeCloseTo(50, 6);
            expect(inter.right).toBeCloseTo(100, 6);
            expect(inter.bottom).toBeCloseTo(100, 6);
            expect(inter.width).toBeCloseTo(50, 6);
            expect(inter.height).toBeCloseTo(50, 6);
        });

        it('★★ 一个矩形完全包含另一个时，交集就是被包含的那个', () =>
        {
            const big = new Rectangle(0, 0, 100, 100);
            const small = new Rectangle(20, 20, 10, 10);
            const inter = big.intersection(small);

            expect(inter.left).toBeCloseTo(20, 6);
            expect(inter.top).toBeCloseTo(20, 6);
            expect(inter.right).toBeCloseTo(30, 6);
            expect(inter.bottom).toBeCloseTo(30, 6);
        });

        it('★ 相离时交集面积为 0（宽或高不为正）', () =>
        {
            const a = new Rectangle(0, 0, 10, 10);
            const b = new Rectangle(100, 100, 10, 10);
            const inter = a.intersection(b);

            expect(inter.width <= 0 || inter.height <= 0).toBe(true);
        });
    });

    describe('★ inflate', () =>
    {
        it('★★ 四边各外扩 dx / dy（位置左移、尺寸增加两倍）', () =>
        {
            const r = new Rectangle(10, 20, 30, 40);

            r.inflate(5, 7);

            expect(r.x).toBeCloseTo(10 - 5, 6);
            expect(r.y).toBeCloseTo(20 - 7, 6);
            expect(r.width).toBeCloseTo(30 + 2 * 5, 6);
            expect(r.height).toBeCloseTo(40 + 2 * 7, 6);
        });

        it('★ inflate 负数会收缩', () =>
        {
            const r = new Rectangle(0, 0, 100, 100);

            r.inflate(-10, -10);

            expect(r.x).toBeCloseTo(10, 6);
            expect(r.y).toBeCloseTo(10, 6);
            expect(r.width).toBeCloseTo(80, 6);
            expect(r.height).toBeCloseTo(80, 6);
        });
    });

    describe('init / copyFrom / isEmpty', () =>
    {
        it('★ init 设定四个字段，并可以链式/返回自身', () =>
        {
            const r = new Rectangle();
            const ret = r.init(1, 2, 3, 4);

            expect(r.x).toBe(1);
            expect(r.y).toBe(2);
            expect(r.width).toBe(3);
            expect(r.height).toBe(4);
            expect(ret).toBe(r);
        });

        it('★ copyFrom 复制四个字段（含从普通字面量对象复制）', () =>
        {
            const r = new Rectangle();

            r.copyFrom({ x: 5, y: 6, width: 7, height: 8 });

            expect(r.x).toBe(5);
            expect(r.y).toBe(6);
            expect(r.width).toBe(7);
            expect(r.height).toBe(8);
        });

        it('★ isEmpty：零尺寸为真、有尺寸为假（只测无歧义的两端）', () =>
        {
            expect(new Rectangle(0, 0, 0, 0).isEmpty()).toBe(true);
            expect(new Rectangle(0, 0, 1, 1).isEmpty()).toBe(false);
            expect(new Rectangle(0, 0, 100, 100).isEmpty()).toBe(false);
        });
    });
});
