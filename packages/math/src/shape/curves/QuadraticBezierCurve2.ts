import type { Vector2Like, WritableVector2Like } from '../../geom/vector2Ops';
import { vec2From } from '../../geom/vector2Ops';
import { Curve } from '../core/Curve';
import { Interpolations } from '../core/Interpolations';

export class QuadraticBezierCurve2 extends Curve<Vector2Like>
{
    v0: Vector2Like;
    v1: Vector2Like;
    v2: Vector2Like;

    constructor(v0: Vector2Like = { x: 0, y: 0 }, v1: Vector2Like = { x: 0, y: 0 }, v2: Vector2Like = { x: 0, y: 0 })
    {
        super();

        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }

    getPoint(t: number, optionalTarget: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
    {
        const point = optionalTarget;
        const v0 = this.v0;
        const v1 = this.v1;
        const v2 = this.v2;

        vec2From(
            Interpolations.QuadraticBezier(t, v0.x, v1.x, v2.x),
            Interpolations.QuadraticBezier(t, v0.y, v1.y, v2.y),
            point
        );

        return point;
    }
}
