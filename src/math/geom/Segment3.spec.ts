import { Line3 } from '../../src/geom/Line3';
import { Segment3 } from '../../src/geom/Segment3';
import { Vector3 } from '../../src/geom/Vector3';
import { assert, describe, expect, it } from 'vitest';
import { Plane } from '../../src/geom/Plane';
Plane;

const { ok, equal, deepEqual } = assert;

describe('Segment3D', () =>
{
    it('onWithPoint', () =>
    {
        const s = new Segment3().random();
        for (let i = 0; i < 10; i++)
        {
            const p = s.getPoint(Math.random());
            assert.ok(s.onWithPoint(p));
        }
    });

    it('intersectionWithLine', () =>
    {
        const s = new Segment3().random();
        const p = s.getPoint(Math.random());
        const l = new Line3().fromPoints(p, new Vector3().random());

        assert.ok(
            p.equals(<Vector3>s.intersectionWithLine(l))
        );

        l.fromPosAndDir(p, s.p1.subTo(s.p0));
        assert.ok(
            s.equals(<Segment3>s.intersectionWithLine(l))
        );
    });

    it('intersectionWithSegment', () =>
    {
        const s = new Segment3().random();
        const p0 = s.getPoint(Math.random());
        const p1 = new Vector3().random();
        const s0 = new Segment3().fromPoints(p0, p1);

        assert.ok(
            p0.equals(<Vector3>s.intersectionWithSegment(s0))
        );

        const p2 = s.getPoint(1 + Math.random());
        const s1 = new Segment3().fromPoints(p0, p2);
        assert.ok(
            new Segment3().fromPoints(p0, s.p1).equals(<Segment3>s.intersectionWithSegment(s1))
        );
    });
});
