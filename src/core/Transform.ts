module feng3d
{
    /**
     * 变换
     * @author feng 2016-04-26
     */
    export class Transform extends Object3DComponent
    {

        //private
        private _position = new Vector3D();
        private _rotation = new Vector3D();
        private _scale = new Vector3D(1, 1, 1);
        //
        private _matrix3D = new Matrix3D();
        private _matrix3DDirty: boolean;
        private _inverseMatrix3D = new Matrix3D();
        private _inverseMatrix3DDirty: boolean;
        /**
         * 全局矩阵是否变脏
         */
        private _globalMatrix3DDirty: boolean;
        /**
         * 全局矩阵
         */
        private _globalMatrix3D: Matrix3D = new Matrix3D();
        private _inverseGlobalMatrix3DDirty: boolean;
        private _inverseGlobalMatrix3D: Matrix3D = new Matrix3D();

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
            this._position.setTo(x, y, z);
            this._rotation.setTo(rx, ry, rz);
            this._scale.setTo(sx, sy, sz);
            WatchUtils.watchObject(this._position, this.invalidateMatrix3D.bind(this));
            WatchUtils.watchObject(this._rotation, this.invalidateMatrix3D.bind(this));
            WatchUtils.watchObject(this._scale, this.invalidateMatrix3D.bind(this));
            this.invalidateMatrix3D();
        }

        /**
         * X坐标
         */
        get x(): number { return this._position.x; }
        set x(value: number) { this._position.x = value; }

        /**
         * Y坐标
         */
        get y(): number { return this._position.y; }
        set y(value: number) { this._position.y = value; }

        /**
         * Z坐标
         */
        get z(): number { return this._position.z; }
        set z(value: number) { this._position.z = value; }

        /**
         * X旋转
         */
        get rx(): number { return this._rotation.x; }
        set rx(value: number) { this._rotation.x = value; }

        /**
         * Y旋转
         */
        get ry(): number { return this._rotation.y; }
        set ry(value: number) { this._rotation.y = value; }

        /**
         * Z旋转
         */
        get rz(): number { return this._rotation.z; }
        set rz(value: number) { this._rotation.z = value; }

        /**
         * X缩放
         */
        get sx(): number { return this._scale.x; }
        set sx(value: number) { this._scale.x = value; }

        /**
         * Y缩放
         */
        get sy(): number { return this._scale.y; }
        set sy(value: number) { this._scale.y = value; }

        /**
         * Z缩放
         */
        get sz(): number { return this._scale.z; }
        set sz(value: number) { this._scale.z = value; }

        /**
         * 位移
         */
        get position(): Vector3D { return this._position };
        set position(value: Vector3D) { this.position.copyFrom(value); }

        /**
         * 旋转
         */
        get rotation(): Vector3D { return this._rotation; }
        set rotation(value: Vector3D) { this._rotation.copyFrom(value); }

        /**
         * 缩放
         */
        get scale(): Vector3D { return this._scale; }
        set scale(value: Vector3D) { this._scale.copyFrom(value); }

        /**
         * 全局坐标
         */
        get globalPosition()
        {
            return this.globalMatrix3D.position;
        }

        /**
         * 变换矩阵
         */
        get matrix3d(): Matrix3D
        {
            if (this._matrix3DDirty)
                this.updateMatrix3D();
            return this._matrix3D;
        }

        set matrix3d(value: Matrix3D)
        {
            var vecs = value.decompose();
            vecs[1].scaleBy(MathConsts.RADIANS_TO_DEGREES);
            this._position.copyFrom(vecs[0]);
            this._rotation.copyFrom(vecs[1]);
            this._scale.copyFrom(vecs[2]);
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

        /**
         * 逆全局矩阵
         */
        public get inverseGlobalMatrix3D(): Matrix3D
        {
            this._inverseGlobalMatrix3DDirty && this.updateInverseGlobalMatrix3D();
            return this._inverseGlobalMatrix3D;
        }

        /**
         * 变换矩阵
         */
        private updateMatrix3D()
        {
            var rotation = this._rotation.clone();
            rotation.scaleBy(MathConsts.DEGREES_TO_RADIANS);
            this._matrix3D.recompose([//
                this._position,//
                rotation,//
                this._scale,//
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
        private notifyMatrix3DChanged()
        {
            var transformChanged = new TransfromEvent(TransfromEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }

        /**
         * 更新全局矩阵
         */
        private updateGlobalMatrix3D()
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
        private updateInverseGlobalMatrix3D()
        {
            this._inverseGlobalMatrix3DDirty = false;
            this._inverseGlobalMatrix3D.copyFrom(this.globalMatrix3D);
            this._inverseGlobalMatrix3D.invert();
        }

        /**
		 * 通知全局变换改变
		 */
        private notifySceneTransformChange()
        {
            var sceneTransformChanged = new TransfromEvent(TransfromEvent.SCENETRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(sceneTransformChanged);
        }

        /**
		 * 全局变换矩阵失效
         * @private
		 */
        public invalidateGlobalMatrix3D()
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