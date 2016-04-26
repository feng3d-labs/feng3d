module me.feng3d {
    /**
     * 3D空间
     * @author feng 2016-04-26
     */
    export class Space3D extends Component {

        /**
         * X坐标
         */
        get x(): number { return this._x; }
        set x(value: number) { this._x = value; this.invalidateMatrix3D(); }

        /**
         * Y坐标
         */
        get y(): number { return this._y; }
        set y(value: number) { this._y = value; this.invalidateMatrix3D(); }

        /**
         * Z坐标
         */
        get z(): number { return this._z; }
        set z(value: number) { this._z = value; this.invalidateMatrix3D(); }

        /**
         * X旋转
         */
        get rx(): number { return this._rx; }

        set rx(value: number) { this._rx = value; this.invalidateMatrix3D(); }

        /**
         * Y旋转
         */
        get ry(): number { return this._ry; }
        set ry(value: number) { this._ry = value; this.invalidateMatrix3D(); }

        /**
         * Z旋转
         */
        get rz(): number { return this._rz; }
        set rz(value: number) { this._rz = value; this.invalidateMatrix3D(); }

        /**
         * X缩放
         */
        get sx(): number { return this._sx; }
        set sx(value: number) { this._sx = value; this.invalidateMatrix3D(); }

        /**
         * Y缩放
         */
        get sy(): number { return this._sy; }
        set sy(value: number) { this._sy = value; this.invalidateMatrix3D(); }

        /**
         * Z缩放
         */
        get sz(): number { return this._sz; }
        set sz(value: number) { this._sz = value; this.invalidateMatrix3D(); }

        /**
         * 空间矩阵（此处返回的是公共的临时矩阵）
         */
        get matrix3D(): Matrix3D {
            if (this.matrix3DDirty)
                this.updateMatrix3D();
            temp.matrix3D.rawData = this._matrix3D.rawData.concat();
            return temp.matrix3D;
        }

        set matrix3D(value: Matrix3D) {
            this.matrix3DDirty = false;
            this._matrix3D.rawData = value.rawData.concat();
            var vecs = this._matrix3D.decompose();
            this.x = vecs[0].x;
            this.y = vecs[0].y;
            this.z = vecs[0].z;
            this.rx = vecs[1].x * MathConsts.RADIANS_TO_DEGREES;
            this.ry = vecs[1].y * MathConsts.RADIANS_TO_DEGREES;
            this.rz = vecs[1].z * MathConsts.RADIANS_TO_DEGREES;
            this.sx = vecs[2].x;
            this.sy = vecs[2].y;
            this.sz = vecs[2].z;
        }

        /**
         * 更新矩阵
         */
        private updateMatrix3D() {
            this._matrix3D.recompose([//
                new Vector3D(this.x, this.y, this.z),//
                new Vector3D(this.rx * MathConsts.DEGREES_TO_RADIANS, this.ry * MathConsts.DEGREES_TO_RADIANS, this.rz * MathConsts.DEGREES_TO_RADIANS),//
                new Vector3D(this.sx, this.sy, this.sz),//
            ]);
            this.matrix3DDirty = false;
        }

        /**
         * 使矩阵无效
         */
        protected invalidateMatrix3D() {
            this.matrix3DDirty = true;
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

        private _matrix3D = new Matrix3D();
        private matrix3DDirty: boolean;
    }
}