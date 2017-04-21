module feng3d
{

	/**
	 * 位移时抛出
	 */
    //[Event(name = "positionChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 旋转时抛出
	 */
    //[Event(name = "rotationChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 缩放时抛出
	 */
    //[Event(name = "scaleChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 变换状态抛出
	 */
    //[Event(name = "transformChanged", type = "me.feng3d.events.Transform3DEvent")]

	/**
	 * 变换已更新
	 */
    //[Event(name = "transformUpdated", type = "me.feng3d.events.Transform3DEvent")]

    /**
	 * 3D元素状态变换<br/><br/>
	 *
	 * 主要功能:
	 * <ul>
	 *     <li>处理3d元素的平移、旋转、缩放等操作</li>
	 * </ul>
	 *
	 * @author feng 2014-3-31
	 */
    export class Transform extends RenderDataHolder
    {
        private _smallestNumber: number = 0.0000000000000000000001;
        protected _transformDirty: boolean = true;

        private _positionDirty: boolean;
        private _rotationDirty: boolean;
        private _scaleDirty: boolean;

        private _positionChanged: Transform3DEvent;
        private _rotationChanged: Transform3DEvent;
        private _scaleChanged: Transform3DEvent;
        private _transformChanged: Transform3DEvent;

        private _eulers: Vector3D = new Vector3D();

        private _listenToPositionChanged: boolean;
        private _listenToRotationChanged: boolean;
        private _listenToScaleChanged: boolean;
        private _listenToTransformChanged: boolean;

        protected _transform: Matrix3D = new Matrix3D();
        protected _x: number = 0;
        protected _y: number = 0;
        protected _z: number = 0;
        protected _rotationX: number = 0;
        protected _rotationY: number = 0;
        protected _rotationZ: number = 0;
        protected _scaleX: number = 1;
        protected _scaleY: number = 1;
        protected _scaleZ: number = 1;
        protected _pivotPoint: Vector3D = new Vector3D();
        protected _pivotZero: boolean = true;
        protected _pos: Vector3D = new Vector3D();
        protected _rot: Vector3D = new Vector3D();
        protected _sca: Vector3D = new Vector3D();
        protected _transformComponents: Vector3D[];

		/**
		 * 创建3D元素状态变换实例
		 */
        constructor()
        {
            super();
            // Cached vector of transformation components used when
            // recomposing the this.transform matrix in this.updateTransform()
            this._transformComponents = [];
            this._transformComponents[0] = this._pos;
            this._transformComponents[1] = this._rot;
            this._transformComponents[2] = this._sca;

            this._transform.identity();
        }

		/**
		 * 相对父容器的X坐标
		 */
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

		/**
		 * 相对父容器的Y坐标
		 */
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

		/**
		 * 相对父容器的Z坐标
		 */
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

		/**
		 * 绕X轴旋转角度
		 */
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

		/**
		 * 绕Y轴旋转角度
		 */
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

		/**
		 * 绕Z轴旋转角度
		 */
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

		/**
		 * X轴旋方向缩放
		 */
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

		/**
		 * Y轴旋方向缩放
		 */
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

		/**
		 * Z轴旋方向缩放
		 */
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

		/**
		 * 欧拉角
		 * <ul>
		 *     <li>使用Vector3D对象表示 相对x、y、z轴上的旋转角度</li>
		 * </ul>
		 */
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

		/**
		 * 3d元素变换矩阵
		 */
        public get transform(): Matrix3D
        {
            if (this._transformDirty)
                this.updateTransform();

            return this._transform;
        }

        public set transform(val: Matrix3D)
        {
            //ridiculous matrix error
            var raw = Matrix3D.RAW_DATA_CONTAINER;
            val.copyRawDataTo(raw);
            if (!raw[0])
            {
                raw[0] = this._smallestNumber;
                val.copyRawDataFrom(raw);
            }

            var elements: Vector3D[] = val.decompose();
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

		/**
		 * 中心点坐标（本地对象旋转点）
		 */
        public get pivotPoint(): Vector3D
        {
            return this._pivotPoint;
        }

        public set pivotPoint(pivot: Vector3D)
        {
            if (!this._pivotPoint)
                this._pivotPoint = new Vector3D();
            this._pivotPoint.x = pivot.x;
            this._pivotPoint.y = pivot.y;
            this._pivotPoint.z = pivot.z;

            this.invalidatePivot();
        }

		/**
		 * 获取在父容器中的坐标
		 */
        public get position(): Vector3D
        {
            this.transform.copyColumnTo(3, this._pos);

            return this._pos.clone();
        }

        public set position(value: Vector3D)
        {
            this._x = value.x;
            this._y = value.y;
            this._z = value.z;

            this.invalidatePosition();
        }

		/**
		 * 使位置数据无效
		 */
        protected invalidatePosition()
        {
            if (this._positionDirty)
                return;

            this._positionDirty = true;

            this.invalidateTransform();

            if (this._listenToPositionChanged)
                this.notifyPositionChanged();
        }

		/**
		 * 发出平移事件
		 */
        private notifyPositionChanged()
        {
            if (!this._positionChanged)
                this._positionChanged = new Transform3DEvent(Transform3DEvent.POSITION_CHANGED, this);

            this.dispatchEvent(this._positionChanged);
        }

		/**
		 * 使变换矩阵失效
		 */
        public invalidateTransform()
        {
            this._transformDirty = true;

            if (this._listenToTransformChanged)
                this.notifyTransformChanged();
        }

		/**
		 * 发出状态改变消息
		 */
        private notifyTransformChanged()
        {
            if (!this._transformChanged)
                this._transformChanged = new Transform3DEvent(Transform3DEvent.TRANSFORM_CHANGED, this);

            this.dispatchEvent(this._transformChanged);
        }

		/**
		 * 更新变换矩阵
		 */
        protected updateTransform()
        {
            this._pos.x = this._x;
            this._pos.y = this._y;
            this._pos.z = this._z;

            this._rot.x = this._rotationX;
            this._rot.y = this._rotationY;
            this._rot.z = this._rotationZ;

            if (!this._pivotZero)
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

            this.dispatchEvent(new Transform3DEvent(Transform3DEvent.TRANSFORM_UPDATED, this));
        }

		/**
		 * 使中心点无效
		 */
        protected invalidatePivot()
        {
            this._pivotZero = (this._pivotPoint.x == 0) && (this._pivotPoint.y == 0) && (this._pivotPoint.z == 0);

            this.invalidateTransform();
        }

		/**
		 * 监听事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
        public addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority: number = 0)
        {
            super.addEventListener(type, listener, thisObject, priority);
            switch (type)
            {
                case Transform3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = true;
                    break;
                case Transform3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
                case Transform3DEvent.SCALE_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
                case Transform3DEvent.TRANSFORM_CHANGED:
                    this._listenToTransformChanged = true;
                    break;
            }
        }

		/**
		 * 移除事件
		 * @param type 事件类型
		 * @param listener 回调函数
		 */
        public removeEventListener(type: string, listener: (event: Event) => void, thisObject: any)
        {
            super.removeEventListener(type, listener, thisObject);

            if (this.hasEventListener(type))
                return;

            switch (type)
            {
                case Transform3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = false;
                    break;
                case Transform3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = false;
                    break;
                case Transform3DEvent.SCALE_CHANGED:
                    this._listenToScaleChanged = false;
                    break;
                case Transform3DEvent.TRANSFORM_CHANGED:
                    this._listenToTransformChanged = false;
                    break;
            }
        }

		/**
		 * 使旋转角度无效
		 */
        protected invalidateRotation()
        {
            if (this._rotationDirty)
                return;

            this._rotationDirty = true;

            this.invalidateTransform();

            if (this._listenToRotationChanged)
                this.notifyRotationChanged();
        }

		/**
		 * 抛出旋转事件
		 */
        private notifyRotationChanged()
        {
            if (!this._rotationChanged)
                this._rotationChanged = new Transform3DEvent(Transform3DEvent.ROTATION_CHANGED, this);

            this.dispatchEvent(this._rotationChanged);
        }

		/**
		 * 使缩放无效
		 */
        protected invalidateScale()
        {
            if (this._scaleDirty)
                return;

            this._scaleDirty = true;

            this.invalidateTransform();

            if (this._listenToScaleChanged)
                this.notifyScaleChanged();
        }

		/**
		 * 抛出缩放事件
		 */
        private notifyScaleChanged()
        {
            if (!this._scaleChanged)
                this._scaleChanged = new Transform3DEvent(Transform3DEvent.SCALE_CHANGED, this);

            this.dispatchEvent(this._scaleChanged);
        }

		/**
		 * 等比缩放
		 * @param value 缩放比例
		 */
        public scale(value: number)
        {
            this._scaleX *= value;
            this._scaleY *= value;
            this._scaleZ *= value;

            this.invalidateScale();
        }

		/**
		 * 向前（Z轴方向）位移
		 * @param distance 位移距离
		 */
        public moveForward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, distance);
        }

		/**
		 * 向后（Z轴负方向）位移
		 * @param distance 位移距离
		 */
        public moveBackward(distance: number)
        {
            this.translateLocal(Vector3D.Z_AXIS, -distance);
        }

		/**
		 * 向左（X轴负方向）位移
		 * @param distance 位移距离
		 */
        public moveLeft(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, -distance);
        }

		/**
		 * 向右（X轴方向）位移
		 * @param distance 位移距离
		 */
        public moveRight(distance: number)
        {
            this.translateLocal(Vector3D.X_AXIS, distance);
        }

		/**
		 * 向上（Y轴方向）位移
		 * @param distance 位移距离
		 */
        public moveUp(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, distance);
        }

		/**
		 * 向下（Y轴负方向）位移
		 * @param distance 位移距离
		 */
        public moveDown(distance: number)
        {
            this.translateLocal(Vector3D.Y_AXIS, -distance);
        }

		/**
		 * 直接移到空间的某个位置
		 * @param newX x坐标
		 * @param newY y坐标
		 * @param newZ z坐标
		 */
        public moveTo(newX: number, newY: number, newZ: number)
        {
            if (this._x == newX && this._y == newY && this._z == newZ)
                return;
            this._x = newX;
            this._y = newY;
            this._z = newZ;

            this.invalidatePosition();
        }

		/**
		 * 移动中心点（旋转点）
		 * @param dx X轴方向位移
		 * @param dy Y轴方向位移
		 * @param dz Z轴方向位移
		 */
        public movePivot(dx: number, dy: number, dz: number)
        {
            if (!this._pivotPoint)
                this._pivotPoint = new Vector3D();
            this._pivotPoint.x += dx;
            this._pivotPoint.y += dy;
            this._pivotPoint.z += dz;

            this.invalidatePivot();
        }

		/**
		 * 在自定义轴上位移
		 * @param axis 自定义轴
		 * @param distance 位移距离
		 */
        public translate(axis: Vector3D, distance: number)
        {
            var x: number = axis.x, y: number = axis.y, z: number = axis.z;
            var len: number = distance / Math.sqrt(x * x + y * y + z * z);

            this._x += x * len;
            this._y += y * len;
            this._z += z * len;

            this.invalidatePosition();
        }

		/**
		 * 在自定义轴上位移<br/>
		 *
		 * 注意：
		 * <ul>
		 * 		<li>没太理解 与 translate的区别</li>
		 * </ul>
		 * @param axis 自定义轴
		 * @param distance 位移距离
		 */
        public translateLocal(axis: Vector3D, distance: number)
        {
            var len: number = distance / axis.length;

            this.transform.prependTranslation(axis.x * len, axis.y * len, axis.z * len);

            this._transform.copyColumnTo(3, this._pos);

            this._x = this._pos.x;
            this._y = this._pos.y;
            this._z = this._pos.z;

            this.invalidatePosition();
        }

		/**
		 * 绕X轴旋转
		 * @param angle 旋转角度
		 */
        public pitch(angle: number)
        {
            this.rotate(Vector3D.X_AXIS, angle);
        }

		/**
		 * 绕Y轴旋转
		 * @param angle 旋转角度
		 */
        public yaw(angle: number)
        {
            this.rotate(Vector3D.Y_AXIS, angle);
        }

		/**
		 * 绕Z轴旋转
		 * @param angle 旋转角度
		 */
        public roll(angle: number)
        {
            this.rotate(Vector3D.Z_AXIS, angle);
        }

		/**
		 * 直接修改欧拉角
		 * @param ax X轴旋转角度
		 * @param ay Y轴旋转角度
		 * @param az Z轴旋转角度
		 */
        public rotateTo(ax: number, ay: number, az: number)
        {
            this._rotationX = ax * MathConsts.DEGREES_TO_RADIANS;
            this._rotationY = ay * MathConsts.DEGREES_TO_RADIANS;
            this._rotationZ = az * MathConsts.DEGREES_TO_RADIANS;

            this.invalidateRotation();
        }

		/**
		 * 绕所给轴旋转
		 * @param axis 任意轴
		 * @param angle 旋转角度
		 */
        public rotate(axis: Vector3D, angle: number)
        {
            var m: Matrix3D = new Matrix3D();
            m.prependRotation(angle, axis);

            var vec: Vector3D = m.decompose()[1];

            this._rotationX += vec.x;
            this._rotationY += vec.y;
            this._rotationZ += vec.z;

            this.invalidateRotation();
        }

		/**
		 * 观察目标
		 * <ul>
		 * 		<li>旋转至朝向给出的点</li>
		 * </ul>
		 * @param target 	目标点
		 * @param upAxis 	旋转后向上方向（并非绝对向上），默认为null，当值为null时会以Y轴为向上方向计算
		 */
        public lookAt(target: Vector3D, upAxis: Vector3D = null)
        {
            var tempAxeX: Vector3D;
            var tempAxeY: Vector3D;
            var tempAxeZ: Vector3D;

            if (!tempAxeX)
                tempAxeX = new Vector3D();
            if (!tempAxeY)
                tempAxeY = new Vector3D();
            if (!tempAxeZ)
                tempAxeZ = new Vector3D();
            //旋转后的X轴
            var xAxis: Vector3D = tempAxeX;
            //旋转后的Y轴
            var yAxis: Vector3D = tempAxeY;
            //旋转后的Z轴
            var zAxis: Vector3D = tempAxeZ;

            var raw: Float32Array;

            //向上方向默认值为Y轴
            if (upAxis == null)
                upAxis = Vector3D.Y_AXIS;

            if (this._transformDirty)
            {
                this.updateTransform();
            }

            //物体与目标点在相同位置时，稍作偏移
            if (new Vector3D(this._x, this._y, this._z).subtract(target).length == 0)
            {
                this._z = target.z + 0.1;
            }

            //获得Z轴
            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();

            //向上方向与Z轴 叉乘 得到X轴
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

            //Z轴叉乘X轴 得到 Y轴，Z与X为标准化向量，得到的Y轴也将是标准化向量
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;

            raw = Matrix3D.RAW_DATA_CONTAINER;

            //根据XYZ轴计算变换矩阵
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
    }

    /**
     * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    export class Transform3DEvent extends Event
    {
        /**
         * 平移
         */
        public static POSITION_CHANGED: string = "positionChanged";

        /**
         * 旋转
         */
        public static ROTATION_CHANGED: string = "rotationChanged";

        /**
         * 缩放
         */
        public static SCALE_CHANGED: string = "scaleChanged";

        /**
         * 变换
         */
        public static TRANSFORM_CHANGED: string = "transformChanged";

        /**
         * 变换已更新
         */
        public static TRANSFORM_UPDATED: string = "transformUpdated";

        /**
         * 场景变换矩阵发生变化
         */
        public static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";

        /**
         * 创建3D对象事件
         * @param type			事件类型
         * @param element3D		发出事件的3D元素
         */
        constructor(type: string, transform3D: Transform, bubbles: boolean = false)
        {
            super(type, transform3D, bubbles);
        }

        /**
         * 发出事件的3D元素
         */
        public get transform3D(): Transform
        {
            return this.data as Transform;
        }
    }
}