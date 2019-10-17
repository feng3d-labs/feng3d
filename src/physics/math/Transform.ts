namespace CANNON
{
    export class Transform
    {
        position: feng3d.Vector3;
        quaternion: feng3d.Quaternion;

        constructor(position = new feng3d.Vector3(), quaternion = new feng3d.Quaternion())
        {
            this.position = position;
            this.quaternion = quaternion;
        }

        toMatrix3D()
        {
            var matrix3D = this.quaternion.toMatrix3D();
            matrix3D.appendTranslation(this.position.x, this.position.y, this.position.z);
            return matrix3D;
        }

        /**
         * @param worldPoint
         * @param result
         */
        pointToLocalFrame(worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            return this.toMatrix3D().invert().transformVector(worldPoint, result);
        }

        /**
         * @param localPoint
         * @param result
         */
        pointToWorldFrame(localPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            return this.toMatrix3D().transformVector(localPoint, result);
        }

        vectorToWorldFrame(localVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            return this.toMatrix3D().deltaTransformVector(localVector, result);
        }

        vectorToLocalFrame(worldVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            return this.toMatrix3D().invert().deltaTransformVector(worldVector, result);
        }
    }
}