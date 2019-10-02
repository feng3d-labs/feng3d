namespace CANNON
{
    export class Plane extends Shape
    {
        worldNormal: feng3d.Vector3;
        worldNormalNeedsUpdate: boolean;

        /**
         * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
         * 
         * @author schteppe
         */
        constructor()
        {
            super({
                type: Shape.types.PLANE
            });

            // World oriented normal
            this.worldNormal = new feng3d.Vector3();
            this.worldNormalNeedsUpdate = true;

            this.boundingSphereRadius = Number.MAX_VALUE;
        }

        computeWorldNormal(quat: feng3d.Quaternion)
        {
            var n = this.worldNormal;
            n.init(0, 1, 0);
            quat.vmult(n, n);
            this.worldNormalNeedsUpdate = false;
        }

        calculateLocalInertia(mass: number, target = new feng3d.Vector3())
        {
            return target;
        }

        volume()
        {
            return Number.MAX_VALUE; // The plane is infinite...
        }

        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            // The plane AABB is infinite, except if the normal is pointing along any axis
            tempNormal.init(0, 1, 0); // Default plane normal is y
            quat.vmult(tempNormal, tempNormal);
            var maxVal = Number.MAX_VALUE;
            min.init(-maxVal, -maxVal, -maxVal);
            max.init(maxVal, maxVal, maxVal);

            if (tempNormal.x === 1) { max.x = pos.x; }
            if (tempNormal.y === 1) { max.y = pos.y; }
            if (tempNormal.z === 1) { max.z = pos.z; }

            if (tempNormal.x === -1) { min.x = pos.x; }
            if (tempNormal.y === -1) { min.y = pos.y; }
            if (tempNormal.z === -1) { min.z = pos.z; }
        }

        updateBoundingSphereRadius()
        {
            this.boundingSphereRadius = Number.MAX_VALUE;
        }
    }

    var tempNormal = new feng3d.Vector3();

}