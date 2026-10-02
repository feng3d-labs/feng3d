import { assert, describe, it } from 'vitest';
import { Line3 } from '../../src/geom/Line3';
import { Vector3 } from '../../src/geom/Vector3';
import {
    line3ClosestPointWithPoint,
    line3DistanceWithPoint,
    line3Equals,
    line3FromPoints,
    line3GetPoint,
    line3GetPointWithZ,
    line3OnWithPoint,
} from '../../src/geom/line3Ops';

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-12, `${msg ?? ''} 期望 ${b} 实际 ${a}`);
const xyz = (v: { x: number; y: number; z: number }) => ({ x: v.x, y: v.y, z: v.z });

const X = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };

/**
 * `line3Ops` 纯函数层的**契约测试**（issue #134 阶段 A2h）。
 * 重点钉住「`normalize` 而非 `Normalize`」这个退化边界（与 `segment3Ops` 同一个坑）。
 */
describe('line3Ops 纯函数层（#134 A2h）', () =>
{
    it('★ P8f：静态 Line3.fromPoints 保持 origin 的对象身份', () =>
    {
        // 静态工厂必须走构造函数（this.origin = origin 的引用赋值），
        // 不能经 new Line3().fromPoints(...) —— 那会委托到 line3FromPoints 把分量复制进占位对象，
        // 对象身份就丢了。Triangle3 批次正是被 Box3.spec 的 assert(triangle.p0 === p0) 抓出来的。
        const p0 = new Vector3(1, 2, 3);

        const line = Line3.fromPoints(p0, new Vector3(4, 2, 3));

        assert.ok(line.origin === p0, 'origin 应是调用方传入的那个对象');
    });

    it('运算不修改入参', () =>
    {
        const p = { x: 5, y: 3, z: 0 };

        line3GetPoint(X, 2);
        line3ClosestPointWithPoint(X, p);
        line3DistanceWithPoint(X, p);

        assert.deepEqual(X, { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } }, '入参直线被修改了');
        assert.deepEqual(p, { x: 5, y: 3, z: 0 }, '入参点被修改了');
    });

    it('out 传自己即就地运算', () =>
    {
        const line = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } };

        line3GetPoint(line, 5, line.origin);

        assert.deepEqual(xyz(line.origin), { x: 5, y: 0, z: 0 });
    });

    it('getPoint / 最近点 / 距离 与手算一致', () =>
    {
        assert.deepEqual(xyz(line3GetPoint(X, 0)), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(line3GetPoint(X, 5)), { x: 5, y: 0, z: 0 });
        assert.deepEqual(xyz(line3ClosestPointWithPoint(X, { x: 5, y: 3, z: 0 })), { x: 5, y: 0, z: 0 });
        near(line3DistanceWithPoint(X, { x: 5, y: 3, z: 0 }), 3, 'distance');
        near(line3DistanceWithPoint(X, { x: 0, y: 0, z: 0 }), 0, 'distance@origin');
    });

    it('getPointWithZ 取 z 对应的点', () =>
    {
        const line = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };

        assert.deepEqual(xyz(line3GetPointWithZ(line, 10)), { x: 0, y: 0, z: 10 });
    });

    it('onWithPoint 与 equals', () =>
    {
        assert.ok(line3OnWithPoint(X, { x: 7, y: 0, z: 0 }));
        assert.ok(!line3OnWithPoint(X, { x: 7, y: 1, z: 0 }));

        // 同一条直线的不同参数化
        assert.ok(line3Equals(X, { origin: { x: 100, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } }));
        assert.ok(!line3Equals(X, { origin: { x: 0, y: 1, z: 0 }, direction: { x: 1, y: 0, z: 0 } }));
    });

    it('★ line3FromPoints 用 normalize()（长度平方判定），不是 Normalize()（kEpsilon）', () =>
    {
        // 两点相距 1e-7（小于 kEpsilon=1e-5）：
        // normalize() 仍会归一化出 (1,0,0)；误用 Normalize() 会得到零方向向量
        const line = line3FromPoints({ x: 0, y: 0, z: 0 }, { x: 1e-7, y: 0, z: 0 });

        assert.deepEqual(xyz(line.direction), { x: 1, y: 0, z: 0 }, '退化边界下应走 normalize() 分支');
    });

    it('line3FromPoints 的 origin 取值语义（复制分量）', () =>
    {
        const p0 = { x: 1, y: 2, z: 3 };
        const line = line3FromPoints(p0, { x: 4, y: 2, z: 3 });

        p0.x = 99;

        assert.equal(line.origin.x, 1, '应是复制而非引用');
        assert.deepEqual(xyz(line.direction), { x: 1, y: 0, z: 0 });
    });

    it('class 委托的接线正确（class 结果 == 纯函数结果）', () =>
    {
        const line = Line3.fromPoints(new Vector3(0, 0, 0), new Vector3(10, 0, 0));

        assert.deepEqual(xyz(line.getPoint(2.5)), xyz(line3GetPoint(line, 2.5)));
        near(line.distanceWithPoint(new Vector3(5, 3, 0)), line3DistanceWithPoint(line, { x: 5, y: 3, z: 0 }), 'distance');
    });
});
