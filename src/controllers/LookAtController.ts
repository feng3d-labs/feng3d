namespace feng3d
{
    export class LookAtController extends ControllerBase
    {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3D = new Vector3D(0.0, 0.0, 0.0);
        protected _upAxis: Vector3D = Vector3D.Y_AXIS;
        protected _pos: Vector3D = new Vector3D();

        constructor(target: GameObject = null, lookAtObject: GameObject = null)
        {
            super(target);

            if (lookAtObject)
                this.lookAtObject = lookAtObject;
            else
                this.lookAtPosition = new Vector3D();
        }

        get upAxis(): Vector3D
        {
            return this._upAxis;
        }

        set upAxis(upAxis: Vector3D)
        {
            this._upAxis = upAxis;
        }

        get lookAtPosition(): Vector3D
        {
            return this._lookAtPosition;
        }

        set lookAtPosition(val: Vector3D)
        {
            this._lookAtPosition = val;
        }

        get lookAtObject()
        {
            return this._lookAtObject;
        }

        set lookAtObject(value)
        {
            if (this._lookAtObject == value)
                return;

            this._lookAtObject = value;
        }

        update(interpolate = true): void
        {
            if (this._targetObject)
            {
                if (this._lookAtPosition)
                {
                    this._targetObject.transform.lookAt(this.lookAtPosition, this._upAxis);
                }
                else if (this._lookAtObject)
                {
                    this._pos = this._lookAtObject.transform.position;
                    this._targetObject.transform.lookAt(this._pos, this._upAxis);
                }
            }
        }
    }
}
