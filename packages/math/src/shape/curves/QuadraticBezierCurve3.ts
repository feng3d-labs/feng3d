import type { Vector3Like, WritableVector3Like } from '../../geom/vector3';
import { vec3From } from '../../geom/vector3';
import { Curve } from '../core/Curve';
import { interpolationsQuadraticBezier } from '../core/interpolations';

export class QuadraticBezierCurve3 extends Curve<Vector3Like>
{
    v0: Vector3Like;
    v1: Vector3Like;
    v2: Vector3Like;

    constructor(v0: Vector3Like = { x: 0, y: 0, z: 0 }, v1: Vector3Like = { x: 0, y: 0, z: 0 }, v2: Vector3Like = { x: 0, y: 0, z: 0 })
    {
        super();

        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }

    getPoint(t: number, optionalTarget: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        const point = optionalTarget;

        const v0 = this.v0;
        const v1 = this.v1;
        const v2 = this.v2;

        vec3From(
            interpolationsQuadraticBezier(t, v0.x, v1.x, v2.x),
            interpolationsQuadraticBezier(t, v0.y, v1.y, v2.y),
            interpolationsQuadraticBezier(t, v0.z, v1.z, v2.z),
            point
        );

        return point;
    }
}
