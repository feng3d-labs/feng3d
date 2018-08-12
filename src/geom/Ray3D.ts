namespace feng3d
{

	/**
	 * 3D射线

	 */
    export class Ray3D extends Line3D
    {
        constructor(position?: Vector3, direction?: Vector3)
        {
            super(position, direction);
        }
    }
}
