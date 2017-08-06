namespace feng3d
{

    /**
     * Position, rotation and scale of an object.
     */
    export class Object3D extends Component
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        @serialize
        get x(): number
        {
            return this._x;
        }

        set x(val: number)
        {
            if (this._x == val)
                return;
            this._x = val;
            this.invalidatePosition();
        }

        @serialize
        get y(): number
        {
            return this._y;
        }

        set y(val: number)
        {
            if (this._y == val)
                return;
            this._y = val;
            this.invalidatePosition();
        }

        @serialize
        get z(): number
        {
            return this._z;
        }

        set z(val: number)
        {
            if (this._z == val)
                return;
            this._z = val;
            this.invalidatePosition();
        }

        @serialize
        get rx(): number
        {
            return this._rx;
        }

        set rx(val: number)
        {
            if (this.rx == val)
                return;
            this._rx = val;
            this.invalidateRotation();
        }

        @serialize
        get ry(): number
        {
            return this._ry;
        }

        set ry(val: number)
        {
            if (this.ry == val)
                return;
            this._ry = val;
            this.invalidateRotation();
        }

        @serialize
        get rz(): number
        {
            return this._rz;
        }

        set rz(val: number)
        {
            if (this.rz == val)
                return;
            this._rz = val;
            this.invalidateRotation();
        }

        @serialize
        get sx(): number
        {
            return this._sx;
        }

        set sx(val: number)
        {
            if (this._sx == val)
                return;
            this._sx = val;
            this.invalidateScale();
        }

        @serialize
        get sy(): number
        {
            return this._sy;
        }

        set sy(val: number)
        {
            if (this._sy == val)
                return;
            this._sy = val;
            this.invalidateScale();
        }

        @serialize
        get sz(): number
        {
            return this._sz;
        }

        set sz(val: number)
        {
            if (this._sz == val)
                return;
            this._sz = val;
            this.invalidateScale();
        }

        /**
         * 是否显示
         */
        @serialize
        visible = true;

        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        @serialize
        mouseEnabled = true;

        /**
         * @private
         */
        get matrix3d(): Matrix3D
        {
            if (!this._matrix3d)
                this.updateMatrix3D();
            return this._matrix3d;
        }

        set matrix3d(val: Matrix3D)
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
         * 旋转矩阵
         */
        get rotationMatrix()
        {
            if (!this._rotationMatrix3d)
                this._rotationMatrix3d = Matrix3D.fromRotation(this._rx, this._ry, this._rz);
            return this._rotationMatrix3d;
        }

        /**
         * 返回保存位置数据的Vector3D对象
         */
        get position(): Vector3D
        {
            return new Vector3D(this._x, this._y, this._z);
        }

        set position({ x = 1, y = 1, z = 1 })
        {
            if (this._x != x || this._y != y || this._z != z)
            {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        }

        get rotation(): Vector3D
        {
            return new Vector3D(this._rx, this._ry, this._rz);
        }

        set rotation({ x = 1, y = 1, z = 1 })
        {
            if (this._rx != x || this._ry != y || this._rz != z)
            {
                this._rx = x;
                this._ry = y;
                this._rz = z;
                this.invalidateRotation();
            }
        }

        get scale()
        {
            return new Vector3D(this._sx, this._sy, this._sz);
        }

        set scale({ x = 1, y = 1, z = 1 })
        {
            if (this._sx != x || this._sy != y || this._sz != z)
            {
                this._sx = x;
                this._sy = y;
                this._sz = z;
                this.invalidateScale();
            }
        }

        get forwardVector(): Vector3D
        {
            return this.matrix3d.forward;
        }

        get rightVector(): Vector3D
        {
            return this.matrix3d.right;
        }

        get upVector(): Vector3D
        {
            return this.matrix3d.up;
        }

        get backVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.forward;
            director.negate();
            return director;
        }

        get leftVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.left;
            director.negate();
            return director;
        }

        get downVector(): Vector3D
        {
            var director: Vector3D = this.matrix3d.up;
            director.negate();
            return director;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
        protected constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

        moveForward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, distance);
        }

        moveBackward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, -distance);
        }

        moveLeft(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, -distance);
        }

        moveRight(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, distance);
        }

        moveUp(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, distance);
        }

        moveDown(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, -distance);
        }

        translate(axis: Vector3D, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        }

        translateLocal(axis: Vector3D, distance: number)
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

        pitch(angle: number)
        {
            this.rotate(Vector3D.X_AXIS, angle);
        }

        yaw(angle: number)
        {
            this.rotate(Vector3D.Y_AXIS, angle);
        }

        roll(angle: number)
        {
            this.rotate(Vector3D.Z_AXIS, angle);
        }

        rotateTo(ax: number, ay: number, az: number)
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
            positionMatrix3d.appendRotation(axis, angle, pivotPoint);
            this.position = positionMatrix3d.position;
            //转换旋转
            var rotationMatrix3d = Matrix3D.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(axis, angle, pivotPoint);
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

        lookAt(target: Vector3D, upAxis: Vector3D = null)
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

        disposeAsset()
        {
            this.dispose();
        }

        invalidateTransform()
        {
            if (!this._matrix3d)
                return;
            this._matrix3d = null;
            this.dispatch("transformChanged", this);
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
        protected _smallestNumber = 0.0000000000000000000001;
        protected _x = 0;
        protected _y = 0;
        protected _z = 0;
        protected _rx = 0;
        protected _ry = 0;
        protected _rz = 0;
        protected _sx = 1;
        protected _sy = 1;
        protected _sz = 1;
        protected _position: Vector3D;
        protected _rotation: Vector3D;
        protected _scale: Vector3D;
        protected _matrix3d: Matrix3D;
        protected _rotationMatrix3d: Matrix3D;
        protected _localToWorldMatrix: Matrix3D;
        protected _worldToLocalMatrix: Matrix3D;
        protected _localToWorldRotationMatrix: Matrix3D;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private invalidateRotation()
        {
            if (!this._rotation)
                return;
            this._rotation = null;
            this._rotationMatrix3d = null;
            this._localToWorldRotationMatrix = null;
            this.dispatch("rotationChanged", this);
            this.invalidateTransform();
        }

        private invalidateScale()
        {
            if (!this._scale)
                return;
            this._scale = null;
            this.dispatch("scaleChanged", this);
            this.invalidateTransform();
        }

        private invalidatePosition()
        {
            if (!this._position)
                return;
            this._position = null;
            this.dispatch("positionChanged", this);
            this.invalidateTransform();
        }
    }
}