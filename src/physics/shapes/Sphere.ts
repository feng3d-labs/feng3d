namespace CANNON
{
    /**
     * 球体
     */
    export class Sphere extends Shape
    {
        /**
         * 半径
         */
        radius: number;

        /**
         * 球体
         * 
         * @param radius 半径
         * @author schteppe / http://github.com/schteppe
         */
        constructor(radius = 1)
        {
            super({
                type: ShapeType.SPHERE
            });

            this.radius = radius;

            console.assert(radius >= 0, `球面半径不能是负的。`);

            this.updateBoundingSphereRadius();
        }

        calculateLocalInertia(mass: number, target = new feng3d.Vector3())
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

        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            pos.subNumberTo(this.radius, min);
            pos.addNumberTo(this.radius, max);
        }
    }
}