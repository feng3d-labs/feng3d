namespace feng3d
{
    export interface Object3DEventType
    {
        visiblityUpdated: GameObject;
    }
    export interface EventType extends Object3DEventType { }

    export class Object3DEventType1
    {
        visiblityUpdated: "visiblityUpdated" = "visiblityUpdated";
    }

    //-------------- test ------------------
    // function a()
    // {
    //     Event.on({}, Object3DEvent.VISIBLITY_UPDATED, (e) => { e.data }, this);
    //     Event.on({}, Object3D.eventtype.visiblityUpdated, (e) => { e.data }, this);
    //     var o = new Object3D(null);
    //     Event.on(o, o.eventtype.visiblityUpdated, (e) => { e.data }, this);
    // }
    //-------------- test ------------------

    /**
     * Position, rotation and scale of an object.
     */
    export class Object3D extends Component
    {
        public static eventtype = new Object3DEventType1();
        public get eventtype()
        {
            return Object3D.eventtype;
        }

        //------------------------------------------
        // Variables
        //------------------------------------------
        @serialize
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

        public get rx(): number
        {
            return this._rx;
        }

        public set rx(val: number)
        {
            if (this.rx == val)
                return;
            this._rx = val;
            this.invalidateRotation();
        }

        public get ry(): number
        {
            return this._ry;
        }

        public set ry(val: number)
        {
            if (this.ry == val)
                return;
            this._ry = val;
            this.invalidateRotation();
        }

        public get rz(): number
        {
            return this._rz;
        }

        public set rz(val: number)
        {
            if (this.rz == val)
                return;
            this._rz = val;
            this.invalidateRotation();
        }

        public get sx(): number
        {
            return this._sx;
        }

        public set sx(val: number)
        {
            if (this._sx == val)
                return;
            this._sx = val;
            this.invalidateScale();
        }

        public get sy(): number
        {
            return this._sy;
        }

        public set sy(val: number)
        {
            if (this._sy == val)
                return;
            this._sy = val;
            this.invalidateScale();
        }

        public get sz(): number
        {
            return this._sz;
        }

        public set sz(val: number)
        {
            if (this._sz == val)
                return;
            this._sz = val;
            this.invalidateScale();
        }

        /**
         * @private
         */
        public get matrix3d(): Matrix3D
        {
            if (!this._matrix3d)
                this.updateMatrix3D();
            return this._matrix3d;
        }

        public set matrix3d(val: Matrix3D)
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
            this.position = elements[0];
            this.rotation = elements[1].scaleBy(180 / Math.PI);
            this.scale = elements[2];
        }

        /**
         * 返回保存位置数据的Vector3D对象
         */
        public get position(): Vector3D
        {
            return new Vector3D(this._x, this._y, this._z);
        }

        public set position({ x = 1, y = 1, z = 1 })
        {
            if (this._x != x || this._y != y || this._z != z)
            {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        }

        public get rotation(): Vector3D
        {
            return new Vector3D(this._rx, this._ry, this._rz);
        }

        public set rotation({ x = 1, y = 1, z = 1 })
        {
            if (this._rx != x || this._ry != y || this._rz != z)
            {
                this._rx = x;
                this._ry = y;
                this._rz = z;
                this.invalidateRotation();
            }
        }

        public get scale()
        {
            return new Vector3D(this._sx, this._sy, this._sz);
        }

        public set scale({ x = 1, y = 1, z = 1 })
        {
            if (this._sx != x || this._sy != y || this._sz != z)
            {
                this._sx = x;
                this._sy = y;
                this._sz = z;
                this.invalidateScale();
            }
        }

        public get forwardVector(): Vector3D
        {
            return this.matrix3d.forward;
        }

        public get rightVector(): Vector3D
        {
            return this.matrix3d.right;
        }

        public get upVector(): Vector3D
        {
            return this.matrix3d.up;
        }

        public get backVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.forward;
            director.negate();
            return director;
        }

        public get leftVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.left;
            director.negate();
            return director;
        }

        public get downVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.up;
            director.negate();
            return director;
        }

        //------------------------------------------
        // Public Functions
        //------------------------------------------
        public constructor(gameObject: GameObject)
        {
            super(gameObject);
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

        public translate(axis: Vector3D, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        }

        public translateLocal(axis: Vector3D, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            var matrix3d = this.matrix3d.clone();
            matrix3d.prependTranslation(x * len, y * len, z * len);
            this._x = matrix3d.position.x;
            this._y = matrix3d.position.y;
            this._z = matrix3d.position.z;
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

        public rotateTo(ax: number, ay: number, az: number)
        {
            this._rx = ax;
            this._ry = ay;
            this._rz = az;
            this.invalidateRotation();
        }

        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         * 
         */
        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D): void
        {
            //转换位移
            var positionMatrix3d = Matrix3D.fromPosition(this.position);
            positionMatrix3d.appendRotation(angle, axis, pivotPoint);
            this.position = positionMatrix3d.position;
            //转换旋转
            var rotationMatrix3d = Matrix3D.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(angle, axis, pivotPoint);
            var newrotation = rotationMatrix3d.decompose()[1];
            newrotation.scaleBy(180 / Math.PI);
            var v = Math.round((newrotation.x - this.rx) / 180);
            if (v % 2 != 0)
            {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = (a: number, b: number, c = 360) =>
            {
                return Math.round((b - a) / c) * c + a;
            }
            newrotation.x = toRound(newrotation.x, this.rx);
            newrotation.y = toRound(newrotation.y, this.ry);
            newrotation.z = toRound(newrotation.z, this.rz);
            this.rotation = newrotation;
        }

        public lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            var xAxis = new Vector3D();
            var yAxis = new Vector3D();
            var zAxis = new Vector3D();
            var raw: Float32Array;
            upAxis = upAxis || Vector3D.Y_AXIS;
            if (!this._matrix3d)
            {
                this.updateMatrix3D();
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
            raw[0] = this._sx * xAxis.x;
            raw[1] = this._sx * xAxis.y;
            raw[2] = this._sx * xAxis.z;
            raw[3] = 0;
            raw[4] = this._sy * yAxis.x;
            raw[5] = this._sy * yAxis.y;
            raw[6] = this._sy * yAxis.z;
            raw[7] = 0;
            raw[8] = this._sz * zAxis.x;
            raw[9] = this._sz * zAxis.y;
            raw[10] = this._sz * zAxis.z;
            raw[11] = 0;
            raw[12] = this._x;
            raw[13] = this._y;
            raw[14] = this._z;
            raw[15] = 1;
            this._matrix3d.copyRawDataFrom(raw);
            this.matrix3d = this.matrix3d;
            if (zAxis.z < 0)
            {
                this.ry = (180 - this.ry);
                this.rx -= 180;
                this.rz -= 180;
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
            this._matrix3d = null;
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------

        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected updateMatrix3D()
        {
            if (!this._position)
                this._position = new Vector3D(this._x, this._y, this._z);
            if (!this._rotation)
                this._rotation = new Vector3D(this._rx, this._ry, this._rz);
            if (!this._scale)
                this._scale = new Vector3D(this._sx, this._sy, this._sz);
            this._matrix3d = new Matrix3D().recompose([this._position, this._rotation.clone().scaleBy(Math.PI / 180), this._scale]);
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _smallestNumber = 0.0000000000000000000001;
        private _x = 0;
        private _y = 0;
        private _z = 0;
        private _rx = 0;
        private _ry = 0;
        private _rz = 0;
        private _sx = 1;
        private _sy = 1;
        private _sz = 1;
        private _position: Vector3D;
        private _rotation: Vector3D;
        private _scale: Vector3D;
        private _matrix3d: Matrix3D;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private invalidateRotation()
        {
            if (!this._rotation)
                return;
            this._rotation = null;
            this.invalidateTransform();
            this.notifyRotationChanged();
        }

        private notifyRotationChanged()
        {
            Event.dispatch(this, <any>Object3DEvent.ROTATION_CHANGED, this);
        }

        private invalidateScale()
        {
            if (!this._scale)
                return;
            this._scale = null;
            this.invalidateTransform();
            this.notifyScaleChanged();
        }

        private notifyScaleChanged()
        {
            Event.dispatch(this, <any>Object3DEvent.SCALE_CHANGED, this);
        }

        private invalidatePosition()
        {
            if (!this._position)
                return;
            this._position = null;
            this.invalidateTransform();
            this.notifyPositionChanged();
        }

        private notifyPositionChanged()
        {
            Event.dispatch(this, <any>Object3DEvent.POSITION_CHANGED, this);
        }
    }
}