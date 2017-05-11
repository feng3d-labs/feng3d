module feng3d
{
    export class HoverController extends LookAtController
    {
        public _currentPanAngle: number = 0;
        public _currentTiltAngle: number = 90;
        private _panAngle: number = 0;
        private _tiltAngle: number = 90;
        private _distance: number = 1000;
        private _minPanAngle: number = -Infinity;
        private _maxPanAngle: number = Infinity;
        private _minTiltAngle: number = -90;
        private _maxTiltAngle: number = 90;
        private _steps: number = 8;
        private _yFactor: number = 2;
        private _wrapPanAngle: boolean = false;
        public get steps(): number
        {
            return this._steps;
        }

        public set steps(val: number)
        {
            val = (val < 1) ? 1 : val;
            if (this._steps == val)
                return;
            this._steps = val;
            this.notifyUpdate();
        }

        public get panAngle(): number
        {
            return this._panAngle;
        }

        public set panAngle(val: number)
        {
            val = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, val));
            if (this._panAngle == val)
                return;
            this._panAngle = val;
            this.notifyUpdate();
        }

        public get tiltAngle(): number
        {
            return this._tiltAngle;
        }

        public set tiltAngle(val: number)
        {
            val = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, val));
            if (this._tiltAngle == val)
                return;
            this._tiltAngle = val;
            this.notifyUpdate();
        }

        public get distance(): number
        {
            return this._distance;
        }

        public set distance(val: number)
        {
            if (this._distance == val)
                return;
            this._distance = val;
            this.notifyUpdate();
        }

        public get minPanAngle(): number
        {
            return this._minPanAngle;
        }

        public set minPanAngle(val: number)
        {
            if (this._minPanAngle == val)
                return;
            this._minPanAngle = val;
            this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
        }

        public get maxPanAngle(): number
        {
            return this._maxPanAngle;
        }

        public set maxPanAngle(val: number)
        {
            if (this._maxPanAngle == val)
                return;
            this._maxPanAngle = val;
            this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
        }

        public get minTiltAngle(): number
        {
            return this._minTiltAngle;
        }

        public set minTiltAngle(val: number)
        {
            if (this._minTiltAngle == val)
                return;
            this._minTiltAngle = val;
            this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
        }

        public get maxTiltAngle(): number
        {
            return this._maxTiltAngle;
        }

        public set maxTiltAngle(val: number)
        {
            if (this._maxTiltAngle == val)
                return;
            this._maxTiltAngle = val;
            this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
        }

        public get yFactor(): number
        {
            return this._yFactor;
        }

        public set yFactor(val: number)
        {
            if (this._yFactor == val)
                return;
            this._yFactor = val;
            this.notifyUpdate();
        }

        public get wrapPanAngle(): boolean
        {
            return this._wrapPanAngle;
        }

        public set wrapPanAngle(val: boolean)
        {
            if (this._wrapPanAngle == val)
                return;
            this._wrapPanAngle = val;
            this.notifyUpdate();
        }


        public constructor(targetObject: GameObject = null, lookAtObject: GameObject = null, panAngle: number = 0, tiltAngle: number = 90, distance: number = 1000, minTiltAngle: number = -90, maxTiltAngle: number = 90, minPanAngle: number = NaN, maxPanAngle: number = NaN, steps: number = 8, yFactor: number = 2, wrapPanAngle: boolean = false)
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

        public update(interpolate: boolean = true)
        {
            if (this._tiltAngle != this._currentTiltAngle || this._panAngle != this._currentPanAngle)
            {
                this.notifyUpdate();
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
                        this._currentPanAngle -= 360;
                    while (this._panAngle - this._currentPanAngle > 180)
                        this._currentPanAngle += 360;
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
            if (<any>!this._targetObject)
                return;
            if (this._lookAtPosition)
            {
                this._pos["x"] = this._lookAtPosition["x"];
                this._pos["y"] = this._lookAtPosition["y"];
                this._pos["z"] = this._lookAtPosition["z"];
            }
            else if (this._lookAtObject)
            {
                if (this._targetObject.parent && this._lookAtObject.parent)
                {
                    if (this._targetObject.parent != this._lookAtObject.parent)
                    {
                        this._pos["x"] = this._lookAtObject.scenePosition["x"];
                        this._pos["y"] = this._lookAtObject.scenePosition["y"];
                        this._pos["z"] = this._lookAtObject.scenePosition["z"];
                        this._targetObject.parent.inverseSceneTransform.transformVector(this._pos, this._pos);
                    }
                    else
                    {
                        this._pos.copyFrom(this._lookAtObject.transform.position);
                    }
                }
                else if (this._lookAtObject.scene)
                {
                    this._pos["x"] = this._lookAtObject.scenePosition["x"];
                    this._pos["y"] = this._lookAtObject.scenePosition["y"];
                    this._pos["z"] = this._lookAtObject.scenePosition["z"];
                }
                else
                {
                    this._pos.copyFrom(this._lookAtObject.transform.position);
                }
            }
            else
            {
                this._pos["x"] = this._origin["x"];
                this._pos["y"] = this._origin["y"];
                this._pos["z"] = this._origin["z"];
            }
            this._targetObject.x = this._pos["x"] + this._distance * Math.sin(this._currentPanAngle * MathConsts.DEGREES_TO_RADIANS) * Math.cos(this._currentTiltAngle * MathConsts.DEGREES_TO_RADIANS);
            this._targetObject.z = this._pos["z"] + this._distance * Math.cos(this._currentPanAngle * MathConsts.DEGREES_TO_RADIANS) * Math.cos(this._currentTiltAngle * MathConsts.DEGREES_TO_RADIANS);
            this._targetObject.y = this._pos["y"] + this._distance * Math.sin(this._currentTiltAngle * MathConsts.DEGREES_TO_RADIANS) * this._yFactor;
            super.update();
        }

    }
}
