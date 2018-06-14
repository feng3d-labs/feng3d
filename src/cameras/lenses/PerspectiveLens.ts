namespace feng3d
{

	/**
	 * 透视摄像机镜头
	 * @author feng 2014-10-14
	 */
    export class PerspectiveLens extends LensBase
    {
        /**
		 * 视野
		 */
        @watch("fieldOfViewChange")
        @serialize
        @oav()
        fieldOfView: number;

		/**
		 * 坐标系类型
		 */
        @watch("coordinateSystemChange")
        @serialize
        @oav()
        coordinateSystem: number;

        //
        _focalLength: number;
        private _yMax: number;
        private _xMax: number;

		/**
		 * 创建一个透视摄像机镜头
		 * @param fieldOfView 视野
		 * @param coordinateSystem 坐标系统类型
		 */
        constructor(fieldOfView = 60, coordinateSystem = CoordinateSystem.LEFT_HANDED)
        {
            super();

            this.fieldOfView = fieldOfView;
            this.coordinateSystem = coordinateSystem;
        }

        private fieldOfViewChange()
        {
            delete this._focalLength;
            this.invalidateMatrix();
        }

        private coordinateSystemChange()
        {
            this.invalidateMatrix();
        }

		/**
		 * 焦距
		 */
        get focalLength(): number
        {
            if (!this._focalLength)
                this._focalLength = 1 / Math.tan(this.fieldOfView * Math.PI / 360);
            return this._focalLength;
        }

        set focalLength(value: number)
        {
            if (value == this._focalLength)
                return;

            this._focalLength = value;

            this.fieldOfView = Math.atan(1 / this._focalLength) * 360 / Math.PI;
        }

        unproject(nX: number, nY: number, sZ: number, v = new Vector3()): Vector3
        {
            v.x = nX;
            v.y = -nY;
            v.z = sZ;

            v.x *= sZ;
            v.y *= sZ;

            this.unprojectionMatrix.transformVector(v, v);

            //z is unaffected by transform
            v.z = sZ;

            return v;
        }

        protected updateMatrix()
        {
            var matrix = this._matrix = new Matrix4x4();
            var raw = matrix.rawData;

            this._focalLength = 1 / Math.tan(this.fieldOfView * Math.PI / 360);
            var _focalLengthInv = 1 / this._focalLength;
            this._yMax = this.near * _focalLengthInv;
            this._xMax = this._yMax * this.aspectRatio;

            // assume unscissored frustum
            var left = -this._xMax;
            var right = this._xMax;
            var top = this._yMax;
            var bottom = -this._yMax;
            // assume unscissored frustum
            raw[0] = this.near / this._xMax;
            raw[5] = this.near / this._yMax;
            raw[10] = this.far / (this.far - this.near);
            raw[11] = 1;
            raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[8] = raw[9] = raw[12] = raw[13] = raw[15] = 0;
            raw[14] = -this.near * raw[10];

            // matrix.setPerspective(this.fieldOfView * Math.PI / 180, this.aspectRatio, this.near, this.far);
            // var matrix1 = new Matrix4x4().setPerspective(this.fieldOfView * Math.PI / 180, this.aspectRatio, this.near, this.far);

            // Switch projection transform from left to right handed.
            if (this.coordinateSystem == CoordinateSystem.RIGHT_HANDED)
                raw[5] = -raw[5];

            var yMaxFar = this.far * _focalLengthInv;
            var xMaxFar = yMaxFar * this.aspectRatio;

            this._frustumCorners[0] = this._frustumCorners[9] = left;
            this._frustumCorners[3] = this._frustumCorners[6] = right;
            this._frustumCorners[1] = this._frustumCorners[4] = bottom;
            this._frustumCorners[7] = this._frustumCorners[10] = top;

            this._frustumCorners[12] = this._frustumCorners[21] = -xMaxFar;
            this._frustumCorners[15] = this._frustumCorners[18] = xMaxFar;
            this._frustumCorners[13] = this._frustumCorners[16] = -yMaxFar;
            this._frustumCorners[19] = this._frustumCorners[22] = yMaxFar;

            this._frustumCorners[2] = this._frustumCorners[5] = this._frustumCorners[8] = this._frustumCorners[11] = this.near;
            this._frustumCorners[14] = this._frustumCorners[17] = this._frustumCorners[20] = this._frustumCorners[23] = this.far;
        }
    }
}
