namespace CANNON
{
    export class Sphere extends Shape
    {
        radius: number;

        /**
         * Spherical shape
         * 
         * @param radius The radius of the sphere, a non-negative number.
         * @author schteppe / http://github.com/schteppe
         */
        constructor(radius: number)
        {
            super({
                type: Shape.types.SPHERE
            });

            this.radius = radius !== undefined ? radius : 1.0;

            if (this.radius < 0)
            {
                throw new Error('The sphere radius cannot be negative.');
            }

            this.updateBoundingSphereRadius();
        }

        calculateLocalInertia(mass: number, target = new Vector3())
        {
            var I = 2.0 * mass * this.radius * this.radius / 5.0;
            target.x = I;
            target.y = I;
            target.z = I;
            return target;
        }

        volume()
        {
            return 4.0 * Math.PI * this.radius / 3.0;
        }

        updateBoundingSphereRadius()
        {
            this.boundingSphereRadius = this.radius;
        }

        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
        {
            var r = this.radius;
            var axes = ['x', 'y', 'z'];
            for (var i = 0; i < axes.length; i++)
            {
                var ax = axes[i];
                min[ax] = pos[ax] - r;
                max[ax] = pos[ax] + r;
            }
        }

    }
}