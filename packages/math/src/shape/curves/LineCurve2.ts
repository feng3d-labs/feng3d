import type { Vector2Like, WritableVector2Like } from '../../geom/vector2';
import { vec2Add, vec2Copy, vec2Normalize, vec2ScaleNumber, vec2Sub } from '../../geom/vector2';
import { Curve } from '../core/Curve';

export class LineCurve2 extends Curve<Vector2Like>
{
    v1: Vector2Like;
    v2: Vector2Like;

    constructor(v1: Vector2Like = { x: 0, y: 0 }, v2: Vector2Like = { x: 0, y: 0 })
    {
        super();
        this.v1 = v1;
        this.v2 = v2;
    }

    getResolution(_divisions: number): number
    {
        return 1;
    }

    getPoint(t: number, optionalTarget: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
    {
        const point = optionalTarget;

        if (t === 1)
        {
            vec2Copy(this.v2, point);
        }
        else
        {
            // 原实现 point.copy(v2).sub(v1); point.scaleNumber(t).add(v1)
            vec2Copy(this.v2, point);
            vec2Sub(point, this.v1, point);
            vec2ScaleNumber(point, t, point);
            vec2Add(point, this.v1, point);
        }

        return point;
    }

    // Line curve is linear, so we can overwrite default getPointAt
    getPointAt(u: number, optionalTarget: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
    {
        return this.getPoint(u, optionalTarget);
    }

    getTangent(_t: number, optionalTarget: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
    {
        const tangent = optionalTarget;

        // 原实现 tangent.copy(v2).sub(v1).normalize()
        vec2Copy(this.v2, tangent);
        vec2Sub(tangent, this.v1, tangent);
        vec2Normalize(tangent, tangent);

        return tangent;
    }
}
