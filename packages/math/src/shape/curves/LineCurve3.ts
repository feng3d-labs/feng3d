import type { Vector3Like, WritableVector3Like } from '../../geom/vector3Ops';
import { vec3Add, vec3Copy, vec3ScaleNumber, vec3Sub } from '../../geom/vector3Ops';
import { Curve } from '../core/Curve';

export class LineCurve3 extends Curve<Vector3Like>
{
    v1: Vector3Like;
    v2: Vector3Like;

    constructor(v1: Vector3Like = { x: 0, y: 0, z: 0 }, v2: Vector3Like = { x: 0, y: 0, z: 0 })
    {
        super();

        this.v1 = v1;
        this.v2 = v2;
    }

    getResolution(_divisions: number): number
    {
        return 1;
    }

    getPoint(t: number, optionalTarget: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        const point = optionalTarget;

        if (t === 1)
        {
            vec3Copy(this.v2, point);
        }
        else
        {
            // 原实现 point.copy(v2).sub(v1); point.multiplyNumber(t).add(v1)
            vec3Copy(this.v2, point);
            vec3Sub(point, this.v1, point);
            vec3ScaleNumber(point, t, point);
            vec3Add(point, this.v1, point);
        }

        return point;
    }

    // Line curve is linear, so we can overwrite default getPointAt

    getPointAt(u: number, optionalTarget: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        return this.getPoint(u, optionalTarget);
    }
}
