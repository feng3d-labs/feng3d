namespace CANNON
{
    export class Vec3Pool extends Pool
    {
        constructor()
        {
            super();
            this.type = feng3d.Vector3;
        }

        /**
         * Construct a vector
         */
        constructObject()
        {
            return new feng3d.Vector3();
        }
    }
}