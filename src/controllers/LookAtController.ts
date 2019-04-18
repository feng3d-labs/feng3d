namespace feng3d
{
    export class LookAtController extends ControllerBase
    {
        protected _lookAtPosition: Vector3;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3 = new Vector3(0.0, 0.0, 0.0);
        protected _upAxis: Vector3 = Vector3.Y_AXIS;
        protected _pos: Vector3 = new Vector3();

        constructor(target?: GameObject, lookAtObject?: GameObject)
        {
            super(target);

            if (lookAtObject)
                this.lookAtObject = lookAtObject;
            else
                this.lookAtPosition = new Vector3();
        }

        get upAxis(): Vector3
        {
            return this._upAxis;
        }

        set upAxis(upAxis: Vector3)
        {
            this._upAxis = upAxis;
        }

        get lookAtPosition(): Vector3
        {
            return this._lookAtPosition;
        }

        set lookAtPosition(val: Vector3)
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
