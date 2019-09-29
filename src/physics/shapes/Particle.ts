namespace CANNON
{
    export class Particle extends Shape
    {
        position: feng3d.Vector3;
        velocity: feng3d.Vector3;
        mass: number;
        force: feng3d.Vector3;

        /**
         * Particle shape.
         * 
         * @author schteppe
         */
        constructor()
        {
            super({
                type: Shape.types.PARTICLE
            });
        }

        /**
         * @param mass
         * @param target
         */
        calculateLocalInertia(mass: number, target: feng3d.Vector3)
        {
            target = target || new feng3d.Vector3();
            target.init(0, 0, 0);
            return target;
        }

        volume()
        {
            return 0;
        }

        updateBoundingSphereRadius()
        {
            this.boundingSphereRadius = 0;
        }

        calculateWorldAABB(pos: feng3d.Vector3, quat: Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            // Get each axis max
            min.copy(pos);
            max.copy(pos);
        }
    }

}