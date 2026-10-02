import type { Vector2Like, WritableVector2Like } from '../../geom/vector2Ops';
import { vec2From } from '../../geom/vector2Ops';
import { Curve } from '../core/Curve';
import { Interpolations } from '../core/Interpolations';

export class SplineCurve2 extends Curve<Vector2Like>
{
    points: Vector2Like[];

    constructor(points: Vector2Like[] = [])
    {
        super();
        this.points = points;
    }

    getResolution(divisions: number): number
    {
        return divisions * this.points.length;
    }

    getPoint(t: number, optionalTarget: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
    {
        const point = optionalTarget;

        const points = this.points;
        const p = (points.length - 1) * t;

        const intPoint = Math.floor(p);
        const weight = p - intPoint;

        const p0 = points[intPoint === 0 ? intPoint : intPoint - 1];
        const p1 = points[intPoint];
        const p2 = points[intPoint > points.length - 2 ? points.length - 1 : intPoint + 1];
        const p3 = points[intPoint > points.length - 3 ? points.length - 1 : intPoint + 2];

        vec2From(
            Interpolations.CatmullRom(weight, p0.x, p1.x, p2.x, p3.x),
            Interpolations.CatmullRom(weight, p0.y, p1.y, p2.y, p3.y),
            point
        );

        return point;
    }
}
