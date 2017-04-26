module feng3d
{
    export class Object3D extends Component
    {
        public _controller: ControllerBase;
        private _smallestNumber: number = 0.0000000000000000000001;
        private _transformDirty: boolean = true;
        private _positionDirty: boolean = false;
        private _rotationDirty: boolean = false;
        private _scaleDirty: boolean = false;
        private _positionChanged: Object3DEvent;
        private _rotationChanged: Object3DEvent;
        private _scaleChanged: Object3DEvent;
        private _rotationX: number = 0;
        private _rotationY: number = 0;
        private _rotationZ: number = 0;
        private _eulers: Vector3D = new Vector3D();
        private _flipY: Matrix3D = new Matrix3D();
        private _listenToPositionChanged: boolean = false;
        private _listenToRotationChanged: boolean = false;
        private _listenToScaleChanged: boolean = false;
        protected _zOffset: number = 0;
        private invalidatePivot()
        {
            this._pivotZero = (this._pivotPoint.x == 0) && (this._pivotPoint.y == 0) && (this._pivotPoint.z == 0);
            this.invalidateTransform();
        }

        private invalidatePosition()
        {
            if (this._positionDirty)
                return;
            this._positionDirty = true;
            this.invalidateTransform();
            if (this._listenToPositionChanged)
                this.notifyPositionChanged();
        }

        private notifyPositionChanged()
        {
            var _self__: any = this;
            if (<any>!this._positionChanged)
                this._positionChanged = new Object3DEvent(Object3DEvent.POSITION_CHANGED, this);
            _self__.dispatchEvent(this._positionChanged);
        }

        public addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority: number = 0)
        {
            super.addEventListener(type, listener, thisObject, priority);
            switch (type)
            {
                case Object3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = true;
                    break;
                case Object3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
                case Object3DEvent.SCALE_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
            }
        }

        public removeEventListener(type: string, listener: (event: Event) => void, thisObject: any)
        {
            var _self__: any = this;
            super.removeEventListener(type, listener, thisObject);
            if (_self__.hasEventListener(type))
                return;
            switch (type)
            {
                case Object3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = false;
                    break;
                case Object3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = false;
                    break;
                case Object3DEvent.SCALE_CHANGED:
                    this._listenToScaleChanged = false;
                    break;
            }
        }

        private invalidateRotation()
        {
            if (this._rotationDirty)
                return;
            this._rotationDirty = true;
            this.invalidateTransform();
            if (this._listenToRotationChanged)
                this.notifyRotationChanged();
        }

        private notifyRotationChanged()
        {
            var _self__: any = this;
            if (<any>!this._rotationChanged)
                this._rotationChanged = new Object3DEvent(Object3DEvent.ROTATION_CHANGED, this);
            _self__.dispatchEvent(this._rotationChanged);
        }

        private invalidateScale()
        {
            if (this._scaleDirty)
                return;
            this._scaleDirty = true;
            this.invalidateTransform();
            if (this._listenToScaleChanged)
                this.notifyScaleChanged();
        }

        private notifyScaleChanged()
        {
            var _self__: any = this;
            if (<any>!this._scaleChanged)
                this._scaleChanged = new Object3DEvent(Object3DEvent.SCALE_CHANGED, this);
            _self__.dispatchEvent(this._scaleChanged);
        }

        protected _transform: Matrix3D = new Matrix3D();
        protected _scaleX: number = 1;
        protected _scaleY: number = 1;
        protected _scaleZ: number = 1;
        protected _x: number = 0;
        protected _y: number = 0;
        protected _z: number = 0;
        protected _pivotPoint: Vector3D = new Vector3D();
        protected _pivotZero: boolean = true;
        protected _pos: Vector3D = new Vector3D();
        protected _rot: Vector3D = new Vector3D();
        protected _sca: Vector3D = new Vector3D();
        protected _transformComponents: Array<Vector3D>;
        public extra: any;
        public get x(): number
        {
            return this._x;
        }

        public set x(val: number)
        {
            if (this._x == val)
                return;
            this._x = val;
            this.invalidatePosition();
        }

        public get y(): number
        {
            return this._y;
        }

        public set y(val: number)
        {
            if (this._y == val)
                return;
            this._y = val;
            this.invalidatePosition();
        }

        public get z(): number
        {
            return this._z;
        }

        public set z(val: number)
        {
            if (this._z == val)
                return;
            this._z = val;
            this.invalidatePosition();
        }

        public get rotationX(): number
        {
            return this._rotationX * MathConsts.RADIANS_TO_DEGREES;
        }

        public set rotationX(val: number)
        {
            if (this.rotationX == val)
                return;
            this._rotationX = val * MathConsts.DEGREES_TO_RADIANS;
            this.invalidateRotation();
        }

        public get rotationY(): number
        {
            return this._rotationY * MathConsts.RADIANS_TO_DEGREES;
        }

        public set rotationY(val: number)
        {
            if (this.rotationY == val)
                return;
            this._rotationY = val * MathConsts.DEGREES_TO_RADIANS;
            this.invalidateRotation();
        }

        public get rotationZ(): number
        {
            return this._rotationZ * MathConsts.RADIANS_TO_DEGREES;
        }

        public set rotationZ(val: number)
        {
            if (this.rotationZ == val)
                return;
            this._rotationZ = val * MathConsts.DEGREES_TO_RADIANS;
            this.invalidateRotation();
        }

        public get scaleX(): number
        {
            return this._scaleX;
        }

        public set scaleX(val: number)
        {
            if (this._scaleX == val)
                return;
            this._scaleX = val;
            this.invalidateScale();
        }

        public get scaleY(): number
        {
            return this._scaleY;
        }

        public set scaleY(val: number)
        {
            if (this._scaleY == val)
                return;
            this._scaleY = val;
            this.invalidateScale();
        }

        public get scaleZ(): number
        {
            return this._scaleZ;
        }

        public set scaleZ(val: number)
        {
            if (this._scaleZ == val)
                return;
            this._scaleZ = val;
            this.invalidateScale();
        }

        public get eulers(): Vector3D
        {
            this._eulers.x = this._rotationX * MathConsts.RADIANS_TO_DEGREES;
            this._eulers.y = this._rotationY * MathConsts.RADIANS_TO_DEGREES;
            this._eulers.z = this._rotationZ * MathConsts.RADIANS_TO_DEGREES;
            return this._eulers;
        }

        public set eulers(value: Vector3D)
        {
            this._rotationX = value.x * MathConsts.DEGREES_TO_RADIANS;
            this._rotationY = value.y * MathConsts.DEGREES_TO_RADIANS;
            this._rotationZ = value.z * MathConsts.DEGREES_TO_RADIANS;
            this.invalidateRotation();
        }

        public get transform(): Matrix3D
        {
            if (this._transformDirty)
                this.updateTransform();
            return this._transform;
        }

        public set transform(val: Matrix3D)
        {
            var raw = Matrix3D.RAW_DATA_CONTAINER;
            val.copyRawDataTo(raw);
            if (!raw[0])
            {
                raw[0] = this._smallestNumber;
                val.copyRawDataFrom(raw);
            }
            var elements: Array<Vector3D> = val.decompose();
            var vec: Vector3D;
            vec = elements[0];
            if (this._x != vec.x || this._y != vec.y || this._z != vec.z)
            {
                this._x = vec.x;
                this._y = vec.y;
                this._z = vec.z;
                this.invalidatePosition();
            }
            vec = elements[1];
            if (this._rotationX != vec.x || this._rotationY != vec.y || this._rotationZ != vec.z)
            {
                this._rotationX = vec.x;
                this._rotationY = vec.y;
                this._rotationZ = vec.z;
                this.invalidateRotation();
            }
            vec = elements[2];
            if (this._scaleX != vec.x || this._scaleY != vec.y || this._scaleZ != vec.z)
            {
                this._scaleX = vec.x;
                this._scaleY = vec.y;
                this._scaleZ = vec.z;
                this.invalidateScale();
            }
        }

        public get pivotPoint(): Vector3D
        {
            return this._pivotPoint;
        }

        public set pivotPoint(pivot: Vector3D)
        {
            if (<any>!this._pivotPoint)
                this._pivotPoint = new Vector3D();
            this._pivotPoint.x = pivot.x;
            this._pivotPoint.y = pivot.y;
            this._pivotPoint.z = pivot.z;
            this.invalidatePivot();
        }

        public getPosition(position: Vector3D = null): Vector3D
        {
            position = position || new Vector3D();
            position.setTo(this._x, this._y, this._z);
            return position;
        }

        public setPosition(x = 0, y = 0, z = 0)
        {
            if (this._x != x || this._y != y || this._z != z)
            {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        }

        public getRotation(rotation: Vector3D = null): Vector3D
        {
            rotation = rotation || new Vector3D();
            rotation.setTo(this._rotationX, this._rotationY, this._rotationZ);
            rotation.scaleBy(MathConsts.RADIANS_TO_DEGREES);
            return rotation;
        }

        public setRotation(x = 0, y = 0, z = 0)
        {
            x = x * MathConsts.DEGREES_TO_RADIANS;
            y = y * MathConsts.DEGREES_TO_RADIANS;
            z = z * MathConsts.DEGREES_TO_RADIANS;
            if (this._x != x || this._y != y || this._z != z)
            {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        }

        public getScale(scale: Vector3D = null)
        {
            scale = scale || new Vector3D();
            scale.setTo(this._scaleX, this._scaleY, this._scaleZ);
            return scale;
        }

        public setScale(x = 1, y = 1, z = 1)
        {
            if (this._scaleX != x || this._scaleY != y || this._scaleZ != z)
            {
                this._scaleX = x;
                this._scaleY = y;
                this._scaleZ = z;
                this.invalidateScale();
            }
        }

        public get forwardVector(): Vector3D
        {
            return this.transform.forward;
        }

        public get rightVector(): Vector3D
        {
            return this.transform.right;
        }

        public get upVector(): Vector3D
        {
            return this.transform.up;
        }

        public get backVector(): Vector3D
        {
            var director: Vector3D = this.transform.forward;
            director.negate();
            return director;
        }

        public get leftVector(): Vector3D
        {
            var director: Vector3D = this.transform.left;
            director.negate();
            return director;
        }

        public get downVector(): Vector3D
        {
            var director: Vector3D = this.transform.up;
            director.negate();
            return director;
        }

        public constructor()
        {
            super();
            this._transformComponents = [];
            this._transformComponents[0] = this._pos;
            this._transformComponents[1] = this._rot;
            this._transformComponents[2] = this._sca;
            this._transform.identity();
            this._flipY.appendScale(1, -1, 1);
        }

        public scale(value: number)
        {
            this._scaleX *= value;
            this._scaleY *= value;
            this._scaleZ *= value;
            this.invalidateScale();
        }

        public moveForward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, distance);
        }

        public moveBackward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, -distance);
        }

        public moveLeft(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, -distance);
        }

        public moveRight(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, distance);
        }

        public moveUp(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, distance);
        }

        public moveDown(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, -distance);
        }

        public moveTo(dx: number, dy: number, dz: number)
        {
            if (this._x == dx && this._y == dy && this._z == dz)
                return;
            this._x = dx;
            this._y = dy;
            this._z = dz;
            this.invalidatePosition();
        }

        public movePivot(dx: number, dy: number, dz: number)
        {
            if (<any>!this._pivotPoint)
                this._pivotPoint = new Vector3D();
            this._pivotPoint.x += dx;
            this._pivotPoint.y += dy;
            this._pivotPoint.z += dz;
            this.invalidatePivot();
        }

        public translate(axis: Vector3D, distance: number)
        {
            var x: number = <any>axis.x, y: number = <any>axis.y, z: number = <any>axis.z;
            var len: number = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        }

        public translateLocal(axis: Vector3D, distance: number)
        {
            var x: number = <any>axis.x, y: number = <any>axis.y, z: number = <any>axis.z;
            var len: number = distance / Math.sqrt(x * x + y * y + z * z);
            this.transform.prependTranslation(x * len, y * len, z * len);
            this._transform.copyColumnTo(3, this._pos);
            this._x = this._pos.x;
            this._y = this._pos.y;
            this._z = this._pos.z;
            this.invalidatePosition();
        }

        public pitch(angle: number)
        {
            this.rotate(Vector3D.X_AXIS, angle);
        }

        public yaw(angle: number)
        {
            this.rotate(Vector3D.Y_AXIS, angle);
        }

        public roll(angle: number)
        {
            this.rotate(Vector3D.Z_AXIS, angle);
        }

        public clone(): Object3D
        {
            var clone: Object3D = new Object3D();
            clone.pivotPoint = this.pivotPoint;
            clone.transform = this.transform;
            clone.name = this.name;
            return clone;
        }

        public rotateTo(ax: number, ay: number, az: number)
        {
            this._rotationX = ax * MathConsts.DEGREES_TO_RADIANS;
            this._rotationY = ay * MathConsts.DEGREES_TO_RADIANS;
            this._rotationZ = az * MathConsts.DEGREES_TO_RADIANS;
            this.invalidateRotation();
        }

        public rotate(axis: Vector3D, angle: number)
        {
            var m: Matrix3D = new Matrix3D();
            m.prependRotation(angle, axis);
            var vec: Vector3D = <any>m.decompose()[1];
            this._rotationX += vec.x;
            this._rotationY += vec.y;
            this._rotationZ += vec.z;
            this.invalidateRotation();
        }

        public static tempAxeX: Vector3D;
        public static tempAxeY: Vector3D;
        public static tempAxeZ: Vector3D;
        public lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            if (<any>!Object3D.tempAxeX)
                Object3D.tempAxeX = new Vector3D();
            if (<any>!Object3D.tempAxeY)
                Object3D.tempAxeY = new Vector3D();
            if (<any>!Object3D.tempAxeZ)
                Object3D.tempAxeZ = new Vector3D();
            var xAxis: Vector3D = Object3D.tempAxeX;
            var yAxis: Vector3D = Object3D.tempAxeY;
            var zAxis: Vector3D = Object3D.tempAxeZ;
            var raw: Float32Array;
            upAxis = upAxis || Vector3D.Y_AXIS;
            if (this._transformDirty)
            {
                this.updateTransform();
            }
            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.length < .05)
            {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            raw = Matrix3D.RAW_DATA_CONTAINER;
            raw[0] = this._scaleX * xAxis.x;
            raw[1] = this._scaleX * xAxis.y;
            raw[2] = this._scaleX * xAxis.z;
            raw[3] = 0;
            raw[4] = this._scaleY * yAxis.x;
            raw[5] = this._scaleY * yAxis.y;
            raw[6] = this._scaleY * yAxis.z;
            raw[7] = 0;
            raw[8] = this._scaleZ * zAxis.x;
            raw[9] = this._scaleZ * zAxis.y;
            raw[10] = this._scaleZ * zAxis.z;
            raw[11] = 0;
            raw[12] = this._x;
            raw[13] = this._y;
            raw[14] = this._z;
            raw[15] = 1;
            this._transform.copyRawDataFrom(raw);
            this.transform = this.transform;
            if (zAxis.z < 0)
            {
                this.rotationY = (180 - this.rotationY);
                this.rotationX -= 180;
                this.rotationZ -= 180;
            }
        }

        public dispose()
        {
        }

        public disposeAsset()
        {
            this.dispose();
        }

        public invalidateTransform()
        {
            this._transformDirty = true;
        }

        protected updateTransform()
        {
            this._pos.x = this._x;
            this._pos.y = this._y;
            this._pos.z = this._z;
            this._rot.x = this._rotationX;
            this._rot.y = this._rotationY;
            this._rot.z = this._rotationZ;
            if (<any>!this._pivotZero)
            {
                this._sca.x = 1;
                this._sca.y = 1;
                this._sca.z = 1;
                this._transform.recompose(this._transformComponents);
                this._transform.appendTranslation(this._pivotPoint.x, this._pivotPoint.y, this._pivotPoint.z);
                this._transform.prependTranslation(-this._pivotPoint.x, -this._pivotPoint.y, -this._pivotPoint.z);
                this._transform.prependScale(this._scaleX, this._scaleY, this._scaleZ);
                this._sca.x = this._scaleX;
                this._sca.y = this._scaleY;
                this._sca.z = this._scaleZ;
            }
            else
            {
                this._sca.x = this._scaleX;
                this._sca.y = this._scaleY;
                this._sca.z = this._scaleZ;
                this._transform.recompose(this._transformComponents);
            }
            this._transformDirty = false;
            this._positionDirty = false;
            this._rotationDirty = false;
            this._scaleDirty = false;
        }

        public get zOffset(): number
        {
            return this._zOffset;
        }

        public set zOffset(value: number)
        {
            this._zOffset = value;
        }
    }
}