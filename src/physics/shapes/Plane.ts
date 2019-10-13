namespace CANNON
{
    /**
     * 平面
     */
    export class Plane extends Shape
    {
        worldNormal = new feng3d.Vector3();

        worldNormalNeedsUpdate = true;

        boundingSphereRadius = Number.MAX_VALUE;

        /**
         * 
         */
        constructor()
        {
            super({
                type: ShapeType.PLANE
            });
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
            return Number.MAX_VALUE;
        }

        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            var tempNormal = new feng3d.Vector3(0, 1, 0);
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
}