import { mathUtil } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { Object3D } from "../core/Object3D";
import { ContainerLogic } from "../core/Container";
import { logic } from '@feng3d/reactivity';
import { LookAtController } from './LookAtController';

export class HoverController extends LookAtController
{
    _currentPanAngle = 0;
    _currentTiltAngle = 90;
    private _panAngle = 0;
    private _tiltAngle = 90;
    private _distance = 1000;
    private _minPanAngle = -Infinity;
    private _maxPanAngle = Infinity;
    private _minTiltAngle = -90;
    private _maxTiltAngle = 90;
    private _steps = 8;
    private _yFactor = 2;
    private _wrapPanAngle = false;
    get steps(): number
    {
        return this._steps;
    }

    set steps(val: number)
    {
        val = (val < 1) ? 1 : val;
        if (this._steps === val)
        {
            return;
        }
        this._steps = val;
        this.update();
    }

    get panAngle(): number
    {
        return this._panAngle;
    }

    set panAngle(val: number)
    {
        val = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, val));
        if (this._panAngle === val)
        {
            return;
        }
        this._panAngle = val;
        this.update();
    }

    get tiltAngle(): number
    {
        return this._tiltAngle;
    }

    set tiltAngle(val: number)
    {
        val = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, val));
        if (this._tiltAngle === val)
        {
            return;
        }
        this._tiltAngle = val;
        this.update();
    }

    get distance(): number
    {
        return this._distance;
    }

    set distance(val: number)
    {
        if (this._distance === val)
        {
            return;
        }
        this._distance = val;
        this.update();
    }

    get minPanAngle(): number
    {
        return this._minPanAngle;
    }

    set minPanAngle(val: number)
    {
        if (this._minPanAngle === val)
        {
            return;
        }
        this._minPanAngle = val;
        this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
    }

    get maxPanAngle(): number
    {
        return this._maxPanAngle;
    }

    set maxPanAngle(val: number)
    {
        if (this._maxPanAngle === val)
        {
            return;
        }
        this._maxPanAngle = val;
        this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
    }

    get minTiltAngle(): number
    {
        return this._minTiltAngle;
    }

    set minTiltAngle(val: number)
    {
        if (this._minTiltAngle === val)
        {
            return;
        }
        this._minTiltAngle = val;
        this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
    }

    get maxTiltAngle(): number
    {
        return this._maxTiltAngle;
    }

    set maxTiltAngle(val: number)
    {
        if (this._maxTiltAngle === val)
        {
            return;
        }
        this._maxTiltAngle = val;
        this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
    }

    get yFactor(): number
    {
        return this._yFactor;
    }

    set yFactor(val: number)
    {
        if (this._yFactor === val)
        {
            return;
        }
        this._yFactor = val;
        this.update();
    }

    get wrapPanAngle(): boolean
    {
        return this._wrapPanAngle;
    }

    set wrapPanAngle(val: boolean)
    {
        if (this._wrapPanAngle === val)
        {
            return;
        }
        this._wrapPanAngle = val;
        this.update();
    }

     
    constructor(targetObject?: Object3D, lookAtObject?: Object3D, panAngle = 0, tiltAngle = 90, distance = 1000, minTiltAngle = -90, maxTiltAngle = 90, minPanAngle = NaN, maxPanAngle = NaN, steps = 8, yFactor = 2, wrapPanAngle = false)
    {
        super(targetObject, lookAtObject);
        this.distance = distance;
        this.panAngle = panAngle;
        this.tiltAngle = tiltAngle;
        this.minPanAngle = minPanAngle || -Infinity;
        this.maxPanAngle = maxPanAngle || Infinity;
        this.minTiltAngle = minTiltAngle;
        this.maxTiltAngle = maxTiltAngle;
        this.steps = steps;
        this.yFactor = yFactor;
        this.wrapPanAngle = wrapPanAngle;
        this._currentPanAngle = this._panAngle;
        this._currentTiltAngle = this._tiltAngle;
    }

    update(interpolate = true)
    {
        if (this._tiltAngle !== this._currentTiltAngle || this._panAngle !== this._currentPanAngle)
        {
            if (this._wrapPanAngle)
            {
                if (this._panAngle < 0)
                {
                    this._currentPanAngle += this._panAngle % 360 + 360 - this._panAngle;
                    this._panAngle = this._panAngle % 360 + 360;
                }
                else
                {
                    this._currentPanAngle += this._panAngle % 360 - this._panAngle;
                    this._panAngle = this._panAngle % 360;
                }
                while (this._panAngle - this._currentPanAngle < -180)
                { this._currentPanAngle -= 360; }
                while (this._panAngle - this._currentPanAngle > 180)
                { this._currentPanAngle += 360; }
            }
            if (interpolate)
            {
                this._currentTiltAngle += (this._tiltAngle - this._currentTiltAngle) / (this.steps + 1);
                this._currentPanAngle += (this._panAngle - this._currentPanAngle) / (this.steps + 1);
            }
            else
            {
                this._currentPanAngle = this._panAngle;
                this._currentTiltAngle = this._tiltAngle;
            }
            if ((Math.abs(this.tiltAngle - this._currentTiltAngle) < 0.01) && (Math.abs(this._panAngle - this._currentPanAngle) < 0.01))
            {
                this._currentTiltAngle = this._tiltAngle;
                this._currentPanAngle = this._panAngle;
            }
        }
        if (!this._targetObject)
        { return; }
        if (this._lookAtPosition)
        {
            this._pos.x = this._lookAtPosition.x;
            this._pos.y = this._lookAtPosition.y;
            this._pos.z = this._lookAtPosition.z;
        }
        else if (this._lookAtObject)
        {
            if (logic(this._targetObject).parent && logic(this._lookAtObject).parent)
            {
                if (logic(this._targetObject).parent !== logic(this._lookAtObject).parent)
                {
                    this._pos.x = logic(this._lookAtObject).worldPosition.x;
                    this._pos.y = logic(this._lookAtObject).worldPosition.y;
                    this._pos.z = logic(this._lookAtObject).worldPosition.z;
                    logic(logic(this._targetObject).parent as Object3D).world2local.transformPoint3(this._pos, this._pos);
                }
                else
                {
                    // 通过 logic().position 读取，使 JSON 字面量（缺失字段）能拿到默认 {0,0,0}
                    this._pos.copy(logic(this._lookAtObject).position);
                }
            }
            else if (logic(this._lookAtObject).scene)
            {
                this._pos.x = logic(this._lookAtObject).worldPosition.x;
                this._pos.y = logic(this._lookAtObject).worldPosition.y;
                this._pos.z = logic(this._lookAtObject).worldPosition.z;
            }
            else
            {
                // 通过 logic().position 读取，使 JSON 字面量（缺失字段）能拿到默认 {0,0,0}
                this._pos.copy(logic(this._lookAtObject).position);
            }
        }
        else
        {
            this._pos.x = this._origin.x;
            this._pos.y = this._origin.y;
            this._pos.z = this._origin.z;
        }
        // 整体写回 raw.position（缺失字段时整体赋值，避免子字段修改崩溃）
        reactive(this._targetObject).position = {
            x: this._pos.x + this._distance * Math.sin(this._currentPanAngle * mathUtil.DEG2RAD) * Math.cos(this._currentTiltAngle * mathUtil.DEG2RAD),
            y: this._pos.y + this._distance * Math.sin(this._currentTiltAngle * mathUtil.DEG2RAD) * this._yFactor,
            z: this._pos.z + this._distance * Math.cos(this._currentPanAngle * mathUtil.DEG2RAD) * Math.cos(this._currentTiltAngle * mathUtil.DEG2RAD),
        };
        super.update();
    }
}
