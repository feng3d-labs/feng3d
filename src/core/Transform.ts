module feng3d
{
    /**
     * 变换
     * @author feng 2016-04-26
     */
    export class Transform extends Object3DComponent
    {
        //private
        protected _x = 0;
        protected _y = 0;
        protected _z = 0;
        protected _rx = 0;
        protected _ry = 0;
        protected _rz = 0;
        protected _sx = 1;
        protected _sy = 1;
        protected _sz = 1;
        //
        protected _matrix3D = new Matrix3D();
        protected _matrix3DDirty: boolean;

        protected _inverseMatrix3D = new Matrix3D();
        protected _inverseMatrix3DDirty: boolean;
        /**
         * 全局矩阵是否变脏
         */
        protected _globalMatrix3DDirty: boolean;
        /**
         * 全局矩阵
         */
        protected _globalMatrix3D: Matrix3D = new Matrix3D();
        protected _inverseGlobalMatrix3DDirty: boolean;
        protected _inverseGlobalMatrix3D: Matrix3D = new Matrix3D();

        /**
         * 构建变换
         * @param x X坐标
         * @param y Y坐标
         * @param z Z坐标
         * @param rx X旋转
         * @param ry Y旋转
         * @param rz Z旋转
         * @param sx X缩放
         * @param sy Y缩放
         * @param sz Z缩放
         */
        constructor(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1)
        {
            super();
            this._x = x;
            this._y = y;
            this._z = z;
            this._rx = rx;
            this._ry = ry;
            this._rz = rz;
            this._sx = sx;
            this._sy = sy;
            this._sz = sz;
            this.invalidateMatrix3D();
        }

        /**
         * X坐标
         */
        public get x(): number { return this._x; }
        public set x(value: number) { this._x = value; this.invalidateMatrix3D(); }

        /**
         * Y坐标
         */
        public get y(): number { return this._y; }
        public set y(value: number) { this._y = value; this.invalidateMatrix3D(); }

        /**
         * Z坐标
         */
        public get z(): number { return this._z; }
        public set z(value: number) { this._z = value; this.invalidateMatrix3D(); }

        /**
         * X旋转
         */
        public get rx(): number { return this._rx; }
        public set rx(value: number) { this._rx = value; this.invalidateMatrix3D(); }

        /**
         * Y旋转
         */
        public get ry(): number { return this._ry; }
        public set ry(value: number) { this._ry = value; this.invalidateMatrix3D(); }

        /**
         * Z旋转
         */
        public get rz(): number { return this._rz; }
        public set rz(value: number) { this._rz = value; this.invalidateMatrix3D(); }

        /**
         * X缩放
         */
        public get sx(): number { return this._sx; }
        public set sx(value: number) { this._sx = value; this.invalidateMatrix3D(); }

        /**
         * Y缩放
         */
        public get sy(): number { return this._sy; }
        public set sy(value: number) { this._sy = value; this.invalidateMatrix3D(); }

        /**
         * Z缩放
         */
        public get sz(): number { return this._sz; }
        public set sz(value: number) { this._sz = value; this.invalidateMatrix3D(); }

        /**
         * 位移
         */
        public get position(): Vector3D { return new Vector3D(this.x, this.y, this.z); };
        public set position(value: Vector3D) { this._x = value.x; this._y = value.y; this._z = value.z; this.invalidateMatrix3D(); }

        /**
         * 旋转
         */
        public get rotation(): Vector3D { return new Vector3D(this.rx, this.ry, this.rz); }
        public set rotation(value: Vector3D) { this._rx = value.x; this._ry = value.y; this._rz = value.z; this.invalidateMatrix3D(); }

        /**
         * 缩放
         */
        public get scale(): Vector3D { return new Vector3D(this.sx, this.sy, this.sz); }
        public set scale(value: Vector3D) { this._sx = value.x; this._sy = value.y; this._sz = value.z; this.invalidateMatrix3D(); }

        /**
         * 全局坐标
         */
        public get globalPosition()
        {
            return this.globalMatrix3D.position;
        }

        public set globalPosition(value)
        {
            var globalMatrix3D = this.globalMatrix3D.clone();
            globalMatrix3D.position = value;
            this.globalMatrix3D = globalMatrix3D;
        }

        /**
         * 变换矩阵
         */
        public get matrix3d(): Matrix3D
        {
            if (this._matrix3DDirty)
                this.updateMatrix3D();
            return this._matrix3D;
        }

        public set matrix3d(value: Matrix3D)
        {
            this._matrix3DDirty = false;
            this._matrix3D.rawData.set(value.rawData);
            var vecs = this._matrix3D.decompose();
            this._x = vecs[0].x;
            this._y = vecs[0].y;
            this._z = vecs[0].z;
            this._rx = vecs[1].x * MathConsts.RADIANS_TO_DEGREES;
            this._ry = vecs[1].y * MathConsts.RADIANS_TO_DEGREES;
            this._rz = vecs[1].z * MathConsts.RADIANS_TO_DEGREES;
            this._sx = vecs[2].x;
            this._sy = vecs[2].y;
            this._sz = vecs[2].z;

            this.notifyMatrix3DChanged();
            this.invalidateGlobalMatrix3D();
        }

        /**
         * 逆变换矩阵
         */
        public get inverseMatrix3D(): Matrix3D
        {
            if (this._inverseMatrix3DDirty)
            {
                this._inverseMatrix3D.copyFrom(this.matrix3d);
                this._inverseMatrix3D.invert();
                this._inverseMatrix3DDirty = false;
            }
            return this._inverseMatrix3D;
        }

        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        public lookAt(target: Vector3D, upAxis: Vector3D = null): void
        {
            this.matrix3d.lookAt(target, upAxis);
            this.matrix3d = this.matrix3d;
        }

        /**
         * 全局矩阵
         */
        public get globalMatrix3D(): Matrix3D
        {
            this._globalMatrix3DDirty && this.updateGlobalMatrix3D();
            return this._globalMatrix3D;
        }

        public set globalMatrix3D(value)
        {
            value = value.clone();
            if (this.object3D && this.object3D.parent)
            {
                value.append(this.object3D.parent.transform.inverseGlobalMatrix3D);
            }
            this.matrix3d = value;
        }

        /**
         * 逆全局矩阵
         */
        public get inverseGlobalMatrix3D(): Matrix3D
        {
            this._inverseGlobalMatrix3DDirty && this.updateInverseGlobalMatrix3D();
            return this._inverseGlobalMatrix3D;
        }

        /**
         * X轴方向移动
         * @param distance  移动距离
         */
        public xMove(distance: number)
        {
            var direction = this.matrix3d.right;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
        }

        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        public yMove(distance: number)
        {
            var direction = this.matrix3d.up;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
        }

        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        public zMove(distance: number)
        {
            var direction = this.matrix3d.forward;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
        }

        /**
         * X轴全局方向移动
         * @param distance  移动距离
         */
        public xGlobalMove(distance: number)
        {
            var direction = this.globalMatrix3D.right;
            direction.scaleBy(distance);
            this.globalPosition = this.globalPosition.add(direction);
        }

        /**
         * Y轴全局方向移动
         * @param distance  移动距离
         */
        public yGlobalMove(distance: number)
        {
            var direction = this.globalMatrix3D.up;
            direction.scaleBy(distance);
            this.globalPosition = this.globalPosition.add(direction);
        }

        /**
         * Z轴全局方向移动
         * @param distance  移动距离
         */
        public zGlobalMove(distance: number)
        {
            var direction = this.globalMatrix3D.forward;
            direction.scaleBy(distance);
            this.globalPosition = this.globalPosition.add(direction);
        }

        /**
         * 变换矩阵
         */
        protected updateMatrix3D()
        {
            this._matrix3D.recompose([//
                new Vector3D(this.x, this.y, this.z),//
                new Vector3D(this.rx * MathConsts.DEGREES_TO_RADIANS, this.ry * MathConsts.DEGREES_TO_RADIANS, this.rz * MathConsts.DEGREES_TO_RADIANS),//
                new Vector3D(this.sx, this.sy, this.sz),//
            ]);
            this._matrix3DDirty = false;
        }

        /**
         * 使变换矩阵无效
         */
        protected invalidateMatrix3D()
        {
            this._matrix3DDirty = true;
            this.notifyMatrix3DChanged();
            //
            this.invalidateGlobalMatrix3D();
        }

        /**
		 * 发出状态改变消息
		 */
        protected notifyMatrix3DChanged()
        {
            var transformChanged = new TransfromEvent(TransfromEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }

        /**
         * 更新全局矩阵
         */
        protected updateGlobalMatrix3D()
        {
            this._globalMatrix3DDirty = false;
            this._globalMatrix3D.copyFrom(this.matrix3d);
            if (this.object3D && this.object3D.parent)
            {
                var parentGlobalMatrix3D = this.object3D.parent.transform.globalMatrix3D;
                this._globalMatrix3D.append(parentGlobalMatrix3D);
            }
        }

        /**
         * 更新逆全局矩阵
         */
        protected updateInverseGlobalMatrix3D()
        {
            this._inverseGlobalMatrix3DDirty = false;
            this._inverseGlobalMatrix3D.copyFrom(this.globalMatrix3D);
            this._inverseGlobalMatrix3D.invert();
        }

        /**
		 * 通知全局变换改变
		 */
        protected notifySceneTransformChange()
        {
            var sceneTransformChanged = new TransfromEvent(TransfromEvent.SCENETRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(sceneTransformChanged);
        }

        /**
		 * 全局变换矩阵失效
         * @private
		 */
        protected invalidateGlobalMatrix3D()
        {
            this._globalMatrix3DDirty = true;
            this._inverseGlobalMatrix3DDirty = true;
            this.notifySceneTransformChange();

            //
            if (this.object3D)
            {
                for (var i = 0; i < this.object3D.numChildren; i++)
                {
                    var element = this.object3D.getChildAt(i)
                    element.transform.invalidateGlobalMatrix3D();
                }
            }
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext)
        {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[RenderDataID.u_modelMatrix] = this.globalMatrix3D;
        }
    }

    /**
	 * 变换事件(3D状态发生改变、位置、旋转、缩放)
	 * @author feng 2014-3-31
	 */
    export class TransfromEvent extends Event
    {
		/**
		 * 变换
		 */
        public static TRANSFORM_CHANGED: string = "transformChanged";

        /**
		 * 场景变换矩阵发生变化
		 */
        public static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";

		/**
		 * 发出事件的3D元素
		 */
        data: Transform;

        /**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: Transform, bubbles = false)
        {
            super(type, data, bubbles);
        }
    }
}