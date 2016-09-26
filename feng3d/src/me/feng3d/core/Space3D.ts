module me.feng3d {
    /**
     * 3D空间
     * @author feng 2016-04-26
     */
    export class Space3D extends Object3DComponent {

        /**
         * 构建3D空间
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
        constructor(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
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
            this.invalidateTransform3D();
        }

        /**
         * X坐标
         */
        get x(): number { return this._x; }
        set x(value: number) { this._x = value; this.invalidateTransform3D(); }

        /**
         * Y坐标
         */
        get y(): number { return this._y; }
        set y(value: number) { this._y = value; this.invalidateTransform3D(); }

        /**
         * Z坐标
         */
        get z(): number { return this._z; }
        set z(value: number) { this._z = value; this.invalidateTransform3D(); }

        /**
         * X旋转
         */
        get rx(): number { return this._rx; }
        set rx(value: number) { this._rx = value; this.invalidateTransform3D(); }

        /**
         * Y旋转
         */
        get ry(): number { return this._ry; }
        set ry(value: number) { this._ry = value; this.invalidateTransform3D(); }

        /**
         * Z旋转
         */
        get rz(): number { return this._rz; }
        set rz(value: number) { this._rz = value; this.invalidateTransform3D(); }

        /**
         * X缩放
         */
        get sx(): number { return this._sx; }
        set sx(value: number) { this._sx = value; this.invalidateTransform3D(); }

        /**
         * Y缩放
         */
        get sy(): number { return this._sy; }
        set sy(value: number) { this._sy = value; this.invalidateTransform3D(); }

        /**
         * Z缩放
         */
        get sz(): number { return this._sz; }
        set sz(value: number) { this._sz = value; this.invalidateTransform3D(); }

        /**
         * 空间变换矩阵
         */
        get transform3D(): Matrix3D {
            if (this.transform3DDirty)
                this.updateTransform3D();
            return this._transform3D;
        }

        set transform3D(value: Matrix3D) {
            this.transform3DDirty = false;
            this._transform3D.rawData.set(value.rawData);
            var vecs = this._transform3D.decompose();
            this._x = vecs[0].x;
            this._y = vecs[0].y;
            this._z = vecs[0].z;
            this._rx = vecs[1].x * MathConsts.RADIANS_TO_DEGREES;
            this._ry = vecs[1].y * MathConsts.RADIANS_TO_DEGREES;
            this._rz = vecs[1].z * MathConsts.RADIANS_TO_DEGREES;
            this._sx = vecs[2].x;
            this._sy = vecs[2].y;
            this._sz = vecs[2].z;
            this.invalidateTransform3D();
        }

        /**
         * 更新变换矩阵
         */
        private updateTransform3D() {
            this._transform3D.recompose([//
                new Vector3D(this.x, this.y, this.z),//
                new Vector3D(this.rx * MathConsts.DEGREES_TO_RADIANS, this.ry * MathConsts.DEGREES_TO_RADIANS, this.rz * MathConsts.DEGREES_TO_RADIANS),//
                new Vector3D(this.sx, this.sy, this.sz),//
            ]);
            this.transform3DDirty = false;
        }

        /**
         * 使变换矩阵无效
         */
        protected invalidateTransform3D() {

            this.transform3DDirty = true;
            this.notifyTransformChanged();
        }

        /**
		 * 发出状态改变消息
		 */
        private notifyTransformChanged() {

            var transformChanged = new Space3DEvent(Space3DEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }

        //private
        private _x = 0;
        private _y = 0;
        private _z = 0;
        private _rx = 0;
        private _ry = 0;
        private _rz = 0;
        private _sx = 1;
        private _sy = 1;
        private _sz = 1;

        private _transform3D = new Matrix3D();
        private transform3DDirty: boolean;
    }

    /**
	 * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
	 * @author feng 2014-3-31
	 */
    export class Space3DEvent extends Event {
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
		 * 发出事件的3D元素
		 */
        data: Space3D;
    }
}