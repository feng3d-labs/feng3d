namespace CANNON
{
    export interface ITransform
    {
        position: feng3d.Vector3;
        quaternion: feng3d.Quaternion;
    }

    export class Transform
    {
        position: feng3d.Vector3;
        quaternion: feng3d.Quaternion;

        constructor(position = new feng3d.Vector3(), quaternion = new feng3d.Quaternion())
        {
            this.position = position;
            this.quaternion = quaternion;
        }

        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(transform: ITransform, worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            worldPoint.subTo(transform.position, result);
            var tmpQuat = transform.quaternion.conjugateTo();
            tmpQuat.vmult(result, result);
            return result;
        }

        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(transform: ITransform, localPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            transform.quaternion.vmult(localPoint, result);
            result.addTo(transform.position, result);
            return result;
        }

        static vectorToWorldFrame(transform: ITransform, localVector: feng3d.Vector3, result: feng3d.Vector3)
        {
            transform.quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToLocalFrame(transform: ITransform, worldVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            transform.quaternion.w *= -1;
            transform.quaternion.vmult(worldVector, result);
            transform.quaternion.w *= -1;
            return result;
        }
    }
}