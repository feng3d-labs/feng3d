import { Line3 } from "./Line3";
import { Vector3 } from "./Vector3";

/**
 * 3D射线
 */
export class Ray3 extends Line3
{
    constructor(origin?: Vector3, direction?: Vector3)
    {
        super(origin, direction);
    }
}

