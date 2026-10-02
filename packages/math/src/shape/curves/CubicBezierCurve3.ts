import type { Vector3Like, WritableVector3Like } from '../../geom/vector3Ops';
import { vec3From } from '../../geom/vector3Ops';
import { Curve } from '../core/Curve';
import { Interpolations } from '../core/Interpolations';

export class CubicBezierCurve3 extends Curve<Vector3Like>
{
    v0: Vector3Like;
    v1: Vector3Like;
    v2: Vector3Like;
    v3: Vector3Like;

    constructor(v0: Vector3Like = { x: 0, y: 0, z: 0 }, v1: Vector3Like = { x: 0, y: 0, z: 0 }, v2: Vector3Like = { x: 0, y: 0, z: 0 }, v3: Vector3Like = { x: 0, y: 0, z: 0 })
    {
        super();

        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    getPoint(t: number, optionalTarget: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        const point = optionalTarget;

        const v0 = this.v0;
        const v1 = this.v1;
        const v2 = this.v2;
        const v3 = this.v3;

        vec3From(
            Interpolations.CubicBezier(t, v0.x, v1.x, v2.x, v3.x),
            Interpolations.CubicBezier(t, v0.y, v1.y, v2.y, v3.y),
            Interpolations.CubicBezier(t, v0.z, v1.z, v2.z, v3.z),
            point
        );

        return point;
    }
}
