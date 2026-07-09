import { Vector3 } from '@feng3d/math';
import { logic,  batchRun, reactive } from '@feng3d/reactivity';
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
                this._lookAtTransform(this._targetObject, this.lookAtPosition, this._upAxis);
            }
            else if (this._lookAtObject)
            {
                const pos = this._lookAtObject.position;
                this._pos.set(pos.x, pos.y, pos.z);
                this._lookAtTransform(this._targetObject, this._pos, this._upAxis);
            }
        }
    }

    private _lookAtTransform(t: Object3D, target: Vector3, upAxis: Vector3)
    {
        const m = logic(t).matrix.value.clone();
        m.lookAt(target, upAxis);
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        const r_pos = reactive(t.position); const r_rot = reactive(t.rotation); const r_scl = reactive(t.scale);
        batchRun(() =>
        {
            r_pos.x = pos.x; r_pos.y = pos.y; r_pos.z = pos.z;
            r_rot.x = rot.x; r_rot.y = rot.y; r_rot.z = rot.z;
            r_scl.x = scl.x; r_scl.y = scl.y; r_scl.z = scl.z;
        });
    }
}
