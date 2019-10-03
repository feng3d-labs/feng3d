namespace CANNON
{
    export class Transform
    {
        position: feng3d.Vector3;
        quaternion: feng3d.Quaternion;

        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: feng3d.Vector3, quaternion: feng3d.Quaternion, worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            worldPoint.subTo(position, result);
            var tmpQuat = quaternion.conjugateTo();
            tmpQuat.vmult(result, result);
            return result;
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

        static vectorToLocalFrame(quaternion: feng3d.Quaternion, worldVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        }
    }
}