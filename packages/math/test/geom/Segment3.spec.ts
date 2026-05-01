import { ok } from 'assert';
import { Line3, Segment3, Vector3 } from '../../src';
import { describe, it } from 'vitest';

describe('Segment3D', () =>
{
    it('onWithPoint', () =>
    {
        const s = Segment3.random();
        for (let i = 0; i < 10; i++)
        {
            const p = s.getPoint(Math.random());
            ok(s.onWithPoint(p));
        }
    });

    it('intersectionWithLine', () =>
    {
        const s = Segment3.random();
        const p = s.getPoint(Math.random());
        const l = Line3.fromPoints(p, Vector3.random());

        ok(
            p.equals(<Vector3>s.intersectionWithLine(l))
        );

        l.fromPosAndDir(p, s.p1.subTo(s.p0));
        ok(
            s.equals(<Segment3>s.intersectionWithLine(l))
        );
    });

    it('intersectionWithSegment', () =>
    {
        const s = Segment3.random();
        const p0 = s.getPoint(Math.random());
        const p1 = Vector3.random();
        const s0 = Segment3.fromPoints(p0, p1);

        ok(
            p0.equals(<Vector3>s.intersectionWithSegment(s0))
        );

        const p2 = s.getPoint(1 + Math.random());
        const s1 = Segment3.fromPoints(p0, p2);
        ok(
            Segment3.fromPoints(p0, s.p1).equals(<Segment3>s.intersectionWithSegment(s1))
        );
    });
});
