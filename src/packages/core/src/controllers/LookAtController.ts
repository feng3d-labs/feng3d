import { Vector3 } from '@feng3d/math';
import { Object3D } from '../core/Object3D';
import { ControllerBase } from './ControllerBase';

export class LookAtController extends ControllerBase
{
    protected _lookAtPosition: Vector3;
    protected _lookAtObject: Object3D;
    protected _origin: Vector3 = new Vector3(0.0, 0.0, 0.0);
    protected _upAxis: Vector3 = Vector3.Y_AXIS;
    protected _pos: Vector3 = new Vector3();

    constructor(target?: Object3D, lookAtObject?: Object3D)
    {
        super(target);

        if (lookAtObject)
        { this.lookAtObject = lookAtObject; }
        else
        { this.lookAtPosition = new Vector3(); }
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
        if (this._lookAtObject === value)
        {
            return;
        }

        this._lookAtObject = value;
    }

    update(_interpolate = true): void
    {
        if (this._targetObject)
        {
            if (this._lookAtPosition)
            {
                this._targetObject.lookAt(this.lookAtPosition, this._upAxis);
            }
            else if (this._lookAtObject)
            {
                this._pos = this._lookAtObject.position;
                this._targetObject.lookAt(this._pos, this._upAxis);
            }
        }
    }
}
