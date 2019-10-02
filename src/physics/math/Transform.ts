namespace CANNON
{
    export class Transform
    {

        position: feng3d.Vector3;
        quaternion: feng3d.Quaternion;

        constructor(options: any = {})
        {
            this.position = new feng3d.Vector3();
            if (options.position)
            {
                this.position.copy(options.position);
            }
            this.quaternion = new feng3d.Quaternion();
            if (options.quaternion)
            {
                this.quaternion.copy(options.quaternion);
            }
        }

        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: feng3d.Vector3, quaternion: feng3d.Quaternion, worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            worldPoint.subTo(position, result);
            quaternion.conjugateTo(tmpQuat);
            tmpQuat.vmult(result, result);
            return result;
        }

        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        pointToLocal(worldPoint: feng3d.Vector3, result: feng3d.Vector3)
        {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        }

        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(position: feng3d.Vector3, quaternion: feng3d.Quaternion, localPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            quaternion.vmult(localPoint, result);
            result.addTo(position, result);
            return result;
        }

        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        pointToWorld(localPoint: feng3d.Vector3, result: feng3d.Vector3)
        {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        }

        vectorToWorldFrame(localVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            this.quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToWorldFrame(quaternion: feng3d.Quaternion, localVector: feng3d.Vector3, result: feng3d.Vector3)
        {
            quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToLocalFrame(position: feng3d.Vector3, quaternion: feng3d.Quaternion, worldVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        }
    }

    var tmpQuat = new feng3d.Quaternion();
}