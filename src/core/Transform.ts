namespace feng3d
{
    export interface TransformEventMap
    {
        /**
         * 变换矩阵变化
         */
        transformChanged
        /**
         * 
         */
        updateLocalToWorldMatrix
    }

    export interface Transform
    {
        once<K extends keyof TransformEventMap>(type: K, listener: (event: Event<TransformEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TransformEventMap>(type: K, data?: TransformEventMap[K], bubbles?: boolean);
        has<K extends keyof TransformEventMap>(type: K): boolean;
        on<K extends keyof TransformEventMap>(type: K, listener: (event: Event<TransformEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof TransformEventMap>(type?: K, listener?: (event: Event<TransformEventMap[K]>) => any, thisObject?: any);
    }

    var fixedNum = 6;

	/**
	 * Position, rotation and scale of an object.
     * 
	 * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
	 */
    @ov({ component: "OVTransform" })
    export class Transform extends Component
    {

        get single() { return true; }

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }

        get scenePosition()
        {
            return this.localToWorldMatrix.position;
        }

        get parent()
        {
            return this.gameObject.parent && this.gameObject.parent.transform;
        }

        /**
         * Matrix that transforms a point from local space into world space.
         */
        get localToWorldMatrix(): Matrix4x4
        {
            if (!this._localToWorldMatrix)
                this._localToWorldMatrix = this.updateLocalToWorldMatrix();
            return this._localToWorldMatrix;
        }

        set localToWorldMatrix(value: Matrix4x4)
        {
            value = value.clone();
            this.parent && value.append(this.parent.worldToLocalMatrix);
            this.matrix3d = value;
        }

        /**
         * 本地转世界逆转置矩阵
         */
        get ITlocalToWorldMatrix()
        {
            if (!this._ITlocalToWorldMatrix)
            {
                this._ITlocalToWorldMatrix = this.localToWorldMatrix.clone();
                this._ITlocalToWorldMatrix.invert().transpose();
            }
            return this._ITlocalToWorldMatrix;
        }

        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        get worldToLocalMatrix(): Matrix4x4
        {
            if (!this._worldToLocalMatrix)
                this._worldToLocalMatrix = this.localToWorldMatrix.clone().invert();
            return this._worldToLocalMatrix;
        }

        get localToWorldRotationMatrix()
        {
            if (!this._localToWorldRotationMatrix)
            {
                this._localToWorldRotationMatrix = this.rotationMatrix.clone();
                if (this.parent)
                    this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);
            }
            return this._localToWorldRotationMatrix;
        }

        /**
         * Transforms direction from local space to world space.
         */
        transformDirection(direction: Vector3)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix;
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix;
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3)
        {
            if (!this.parent)
                return direction.clone();
            var matrix3d = this.parent.localToWorldRotationMatrix.clone().invert();
            direction = matrix3d.transformVector(direction);
            return direction;
        }

        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3)
        {
            if (!this.parent)
                return position.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            position = matrix3d.transformVector(position);
            return position;
        }

        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3)
        {
            if (!this.parent)
                return vector.clone();
            var matrix3d = this.parent.localToWorldMatrix.clone().invert();
            vector = matrix3d.deltaTransformVector(vector);
            return vector;
        }

        dispose()
        {
            super.dispose();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------


        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected updateLocalToWorldMatrix()
        {
            this._localToWorldMatrix = this.matrix3d.clone();
            if (this.parent)
                this._localToWorldMatrix.append(this.parent.localToWorldMatrix);
            this.dispatch("updateLocalToWorldMatrix");
            return this._localToWorldMatrix;
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------


        //------------------------------------------
        // Private Methods
        //------------------------------------------
        protected invalidateSceneTransform()
        {
            if (!this._localToWorldMatrix)
                return;
            this._localToWorldMatrix = null;
            this._ITlocalToWorldMatrix = null;
            this._worldToLocalMatrix = null;
            this.gameObject.dispatch("scenetransformChanged", this);
            //
            for (var i = 0, n = this.gameObject.numChildren; i < n; i++)
            {
                this.gameObject.getChildAt(i).transform.invalidateSceneTransform();
            }
        }

        //------------------------------------------
        // Variables
        //------------------------------------------
        @serialize
        @oav()
        get x(): number
        {
            return this._x;
        }

        set x(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this._x == val)
                return;
            this._x = val;
            this.invalidatePosition();
        }

        @serialize
        @oav()
        get y(): number
        {
            return this._y;
        }

        set y(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this._y == val)
                return;
            this._y = val;
            this.invalidatePosition();
        }

        @serialize
        @oav()
        get z(): number
        {
            return this._z;
        }

        set z(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this._z == val)
                return;
            this._z = val;
            this.invalidatePosition();
        }

        @serialize
        @oav()
        get rx(): number
        {
            return this._rx;
        }

        set rx(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this.rx == val)
                return;
            this._rx = val;
            this.invalidateRotation();
        }

        @serialize
        @oav()
        get ry(): number
        {
            return this._ry;
        }

        set ry(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this.ry == val)
                return;
            this._ry = val;
            this.invalidateRotation();
        }

        @serialize
        @oav()
        get rz(): number
        {
            return this._rz;
        }

        set rz(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val));
            if (this.rz == val)
                return;
            this._rz = val;
            this.invalidateRotation();
        }

        @serialize
        @oav()
        get sx(): number
        {
            return this._sx;
        }

        set sx(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val) && val != 0);
            if (this._sx == val)
                return;
            this._sx = val;
            this.invalidateScale();
        }

        @serialize
        @oav()
        get sy(): number
        {
            return this._sy;
        }

        set sy(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val) && val != 0);
            if (this._sy == val)
                return;
            this._sy = val;
            this.invalidateScale();
        }

        @serialize
        @oav()
        get sz(): number
        {
            return this._sz;
        }

        set sz(val: number)
        {
            val = Number(val.toFixed(fixedNum));
            debuger && assert(!isNaN(val) && val != 0);
            if (this._sz == val)
                return;
            this._sz = val;
            this.invalidateScale();
        }

        /**
         * @private
         */
        get matrix3d(): Matrix4x4
        {
            if (!this._matrix3d)
                this.updateMatrix3D();
            return this._matrix3d;
        }

        set matrix3d(val: Matrix4x4)
        {
            var raw = Matrix4x4.RAW_DATA_CONTAINER;
            val.copyRawDataTo(raw);
            if (!raw[0])
            {
                raw[0] = this._smallestNumber;
                val.copyRawDataFrom(raw);
            }
            val.decompose(Orientation3D.EULER_ANGLES, elements);
            this.position = elements[0];
            this.rotation = elements[1].scale(FMath.RAD2DEG);
            this.scale = elements[2];
        }

        /**
         * 旋转矩阵
         */
        get rotationMatrix()
        {
            if (!this._rotationMatrix3d)
                this._rotationMatrix3d = Matrix4x4.fromRotation(this._rx, this._ry, this._rz);
            return this._rotationMatrix3d;
        }

        /**
         * 返回保存位置数据的Vector3D对象
         */
        get position(): Vector3
        {
            this._position.init(this._x, this._y, this._z);
            return this._position;
        }

        set position({ x = 1, y = 1, z = 1 })
        {
            x = Number(x.toFixed(fixedNum));
            y = Number(y.toFixed(fixedNum));
            z = Number(z.toFixed(fixedNum));
            debuger && assert(!isNaN(x));
            debuger && assert(!isNaN(y));
            debuger && assert(!isNaN(z));

            if (this._x != x || this._y != y || this._z != z)
            {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        }

        get rotation()
        {
            this._rotation.init(this._rx, this._ry, this._rz);
            return this._rotation;
        }

        set rotation({ x = 0, y = 0, z = 0 })
        {
            x = Number(x.toFixed(fixedNum));
            y = Number(y.toFixed(fixedNum));
            z = Number(z.toFixed(fixedNum));
            debuger && assert(!isNaN(x));
            debuger && assert(!isNaN(y));
            debuger && assert(!isNaN(z));
            if (this._rx != x || this._ry != y || this._rz != z)
            {
                this._rx = x;
                this._ry = y;
                this._rz = z;
                this.invalidateRotation();
            }
        }

        /**
         * 四元素旋转
         */
        get orientation()
        {
            this._orientation.fromMatrix(this.matrix3d);
            return this._orientation;
        }

        set orientation(value)
        {
            var angles = value.toEulerAngles();
            angles.scale(FMath.RAD2DEG);
            this.rotation = angles;
        }

        get scale()
        {
            this._scale.init(this._sx, this._sy, this._sz);
            return this._scale;
        }

        set scale({ x = 1, y = 1, z = 1 })
        {
            x = Number(x.toFixed(fixedNum));
            y = Number(y.toFixed(fixedNum));
            z = Number(z.toFixed(fixedNum));
            debuger && assert(!isNaN(x) && x != 0);
            debuger && assert(!isNaN(y) && y != 0);
            debuger && assert(!isNaN(z) && z != 0);
            if (this._sx != x || this._sy != y || this._sz != z)
            {
                this._sx = x;
                this._sy = y;
                this._sz = z;
                this.invalidateScale();
            }
        }

        get forwardVector(): Vector3
        {
            return this.matrix3d.forward;
        }

        get rightVector(): Vector3
        {
            return this.matrix3d.right;
        }

        get upVector(): Vector3
        {
            return this.matrix3d.up;
        }

        get backVector(): Vector3
        {
            var director: Vector3 = this.matrix3d.forward;
            director.negate();
            return director;
        }

        get leftVector(): Vector3
        {
            var director: Vector3 = this.matrix3d.left;
            director.negate();
            return director;
        }

        get downVector(): Vector3
        {
            var director: Vector3 = this.matrix3d.up;
            director.negate();
            return director;
        }

        moveForward(distance: number)
        {
            this.translateLocal(Vector3.Z_AXIS, distance);
        }

        moveBackward(distance: number)
        {
            this.translateLocal(Vector3.Z_AXIS, -distance);
        }

        moveLeft(distance: number)
        {
            this.translateLocal(Vector3.X_AXIS, -distance);
        }

        moveRight(distance: number)
        {
            this.translateLocal(Vector3.X_AXIS, distance);
        }

        moveUp(distance: number)
        {
            this.translateLocal(Vector3.Y_AXIS, distance);
        }

        moveDown(distance: number)
        {
            this.translateLocal(Vector3.Y_AXIS, -distance);
        }

        translate(axis: Vector3, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        }

        translateLocal(axis: Vector3, distance: number)
        {
            var x = <any>axis.x, y = <any>axis.y, z = <any>axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            var matrix3d = this.matrix3d.clone();
            matrix3d.prependTranslation(x * len, y * len, z * len);
            this._x = matrix3d.position.x;
            this._y = matrix3d.position.y;
            this._z = matrix3d.position.z;
            this.invalidatePosition();
            this.invalidateSceneTransform();
        }

        pitch(angle: number)
        {
            this.rotate(Vector3.X_AXIS, angle);
        }

        yaw(angle: number)
        {
            this.rotate(Vector3.Y_AXIS, angle);
        }

        roll(angle: number)
        {
            this.rotate(Vector3.Z_AXIS, angle);
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
        rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void
        {
            //转换位移
            var positionMatrix3d = Matrix4x4.fromPosition(this.position);
            positionMatrix3d.appendRotation(axis, angle, pivotPoint);
            this.position = positionMatrix3d.position;
            //转换旋转
            var rotationMatrix3d = Matrix4x4.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(axis, angle, pivotPoint);
            var newrotation = rotationMatrix3d.decompose()[1];
            newrotation.scale(180 / Math.PI);
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
            this.invalidateSceneTransform();
        }

        lookAt(target: Vector3, upAxis?: Vector3)
        {
            var xAxis = new Vector3();
            var yAxis = new Vector3();
            var zAxis = new Vector3();
            var raw: number[];
            upAxis = upAxis || Vector3.Y_AXIS;
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
            raw = Matrix4x4.RAW_DATA_CONTAINER;
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
            this.invalidateSceneTransform();
        }

        disposeAsset()
        {
            this.dispose();
        }

        invalidateTransform()
        {
            if (!this._matrix3d)
                return;
            this._matrix3d = <any>null;
            this.dispatch("transformChanged", this);
            this.invalidateSceneTransform();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------

        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        protected updateMatrix3D()
        {
            tempComponents[0].init(this._x, this._y, this._z);
            tempComponents[1].init(this._rx * FMath.DEG2RAD, this._ry * FMath.DEG2RAD, this._rz * FMath.DEG2RAD);
            tempComponents[2].init(this._sx, this._sy, this._sz);

            this._matrix3d = new Matrix4x4().recompose(tempComponents);
        }

        //------------------------------------------
        // Private Properties
        //------------------------------------------
        private _position = new Vector3();
        private _rotation = new Vector3();
        private _orientation = new Quaternion();
        private _scale = new Vector3(1, 1, 1);

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
        protected _matrix3d: Matrix4x4;
        protected _rotationMatrix3d: Matrix4x4 | null;
        protected _localToWorldMatrix: Matrix4x4 | null;
        protected _ITlocalToWorldMatrix: Matrix4x4 | null;
        protected _worldToLocalMatrix: Matrix4x4 | null;
        protected _localToWorldRotationMatrix: Matrix4x4 | null;

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        private invalidateRotation()
        {
            if (!this._rotation)
                return;
            this._rotationMatrix3d = null;
            this._localToWorldRotationMatrix = null;
            this.invalidateTransform();
        }

        private invalidateScale()
        {
            if (!this._scale)
                return;
            this.invalidateTransform();
        }

        private invalidatePosition()
        {
            if (!this._position)
                return;
            this.invalidateTransform();
        }
    }

    var tempComponents = [new Vector3(), new Vector3(), new Vector3()];
    var elements = [new Vector3(), new Vector3(), new Vector3()];
}
