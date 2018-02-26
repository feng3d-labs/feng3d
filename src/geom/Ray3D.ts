namespace feng3d
{

	/**
	 * 3D射线
	 * @author feng 2013-6-13
	 */
    export class Ray3D extends Line3D
    {
        constructor(position?: Vector3, direction?: Vector3)
        {
            super(position, direction);
        }
    }
}
