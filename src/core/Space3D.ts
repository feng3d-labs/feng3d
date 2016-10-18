module feng3d {
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
            if (this._transform3DDirty)
                this.updateTransform3D();
            return this._transform3D;
        }

        set transform3D(value: Matrix3D) {
            this._transform3DDirty = false;
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
            this._transform3DDirty = false;
        }

        /**
         * 使变换矩阵无效
         */
        protected invalidateTransform3D() {
            this._transform3DDirty = true;
            this._inverseTransformDirty = true;
            this.notifyTransformChanged();
        }

        public get inverseTransform(): Matrix3D {
            if (this._inverseTransformDirty) {
                this._inverseTransform.copyFrom(this.transform3D);
                this._inverseTransform.invert();
                this._inverseTransformDirty = false;
            }
            return this._inverseTransform;
        }

        /**
		 * 发出状态改变消息
		 */
        private notifyTransformChanged() {
            var transformChanged = new Space3DEvent(Space3DEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }

        public lookAt(target: Vector3D, upAxis: Vector3D = null): void {
            var xAxis: Vector3D = new Vector3D();
            var yAxis: Vector3D = new Vector3D();
            var zAxis: Vector3D = new Vector3D();

            upAxis = upAxis || Vector3D.Y_AXIS;

            if (this._transform3DDirty)
                this.updateTransform3D();

            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();

            xAxis.x = upAxis.y*zAxis.z - upAxis.z*zAxis.y;
			xAxis.y = upAxis.z*zAxis.x - upAxis.x*zAxis.z;
			xAxis.z = upAxis.x*zAxis.y - upAxis.y*zAxis.x;
			xAxis.normalize();

            if (xAxis.length < .05) {
				xAxis.x = upAxis.y;
				xAxis.y = upAxis.x;
				xAxis.z = 0;
				xAxis.normalize();
			}

            yAxis.x = zAxis.y*xAxis.z - zAxis.z*xAxis.y;
			yAxis.y = zAxis.z*xAxis.x - zAxis.x*xAxis.z;
			yAxis.z = zAxis.x*xAxis.y - zAxis.y*xAxis.x;

            this._transform3D.rawData[0] = this._sx*xAxis.x;
			this._transform3D.rawData[1] = this._sx*xAxis.y;
			this._transform3D.rawData[2] = this._sx*xAxis.z;
			this._transform3D.rawData[3] = 0;
			
			this._transform3D.rawData[4] = this._sy*yAxis.x;
			this._transform3D.rawData[5] = this._sy*yAxis.y;
			this._transform3D.rawData[6] = this._sy*yAxis.z;
			this._transform3D.rawData[7] = 0;
			
			this._transform3D.rawData[8] = this._sz*zAxis.x;
			this._transform3D.rawData[9] = this._sz*zAxis.y;
			this._transform3D.rawData[10] = this._sz*zAxis.z;
			this._transform3D.rawData[11] = 0;
			
			this._transform3D.rawData[12] = this._x;
			this._transform3D.rawData[13] = this._y;
			this._transform3D.rawData[14] = this._z;
			this._transform3D.rawData[15] = 1;

            this.transform3D = this._transform3D;

	        if (zAxis.z < 0) {
				this.ry = (180 - this.ry);
				this.rx -= 180;
				this.rz -= 180;
			}
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
        private _transform3DDirty: boolean;
        private _inverseTransform = new Matrix3D();
        private _inverseTransformDirty: boolean;
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