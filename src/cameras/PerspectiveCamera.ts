module feng3d
{

	/**
	 * 透视摄像机
	 * @author feng 2014-10-14
	 */
    export class PerspectiveCamera extends Camera
    {
        /**
		 * 视角
		 */
        public fieldOfView = 60;
        /**
		 * 坐标系类型
		 */
        public coordinateSystem = CoordinateSystem.LEFT_HANDED;

		/**
		 * 创建一个透视摄像机
		 * @param fieldOfView 视角
		 * @param coordinateSystem 坐标系统类型
		 */
        constructor()
        {
            super();

            Watcher.watch(this, ["fieldOfView"], this.invalidateMatrix, this);
            Watcher.watch(this, ["coordinateSystem"], this.invalidateMatrix, this);
        }

        /**
		 * 屏幕坐标投影到场景坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        public unproject(nX: number, nY: number, sZ: number, v: Vector3D = null): Vector3D
        {
            if (!v)
                v = new Vector3D();
            v.x = nX;
            v.y = -nY;
            v.z = sZ;
            v.w = 1;

            v.x *= sZ;
            v.y *= sZ;

            this.unprojectionMatrix.transformVector(v, v);

            v.z = sZ;

            this.globalMatrix3D.transformVector(v, v);

            return v;
        }

        /**
         * 更新投影矩阵
         */
        protected updateMatrix()
        {
            var raw = tempRawData;

            var focalLengthInv = Math.tan(this.fieldOfView * Math.PI / 360);
            var yMax = this.near * focalLengthInv;
            var xMax = yMax * this.aspectRatio;

            var left: number, right: number, top: number, bottom: number;

            if (this.scissorRect.x == 0 && this.scissorRect.y == 0 && this.scissorRect.width == this.viewPort.width && this.scissorRect.height == this.viewPort.height)
            {
                // assume unscissored frustum
                left = -xMax;
                right = xMax;
                top = -yMax;
                bottom = yMax;
                // assume unscissored frustum
                raw[0] = this.near / xMax;
                raw[5] = this.near / yMax;
                raw[10] = this.far / (this.far - this.near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[8] = raw[9] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -this.near * raw[10];
            }
            else
            {
                // assume scissored frustum
                var xWidth: number = xMax * (this.viewPort.width / this.scissorRect.width);
                var yHgt: number = yMax * (this.viewPort.height / this.scissorRect.height);
                var center: number = xMax * (this.scissorRect.x * 2 - this.viewPort.width) / this.scissorRect.width + xMax;
                var middle: number = -yMax * (this.scissorRect.y * 2 - this.viewPort.height) / this.scissorRect.height - yMax;

                left = center - xWidth;
                right = center + xWidth;
                top = middle - yHgt;
                bottom = middle + yHgt;

                raw[0] = 2 * this.near / (right - left);
                raw[5] = 2 * this.near / (bottom - top);
                raw[8] = (right + left) / (right - left);
                raw[9] = (bottom + top) / (bottom - top);
                raw[10] = (this.far + this.near) / (this.far - this.near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -2 * this.far * this.near / (this.far - this.near);
            }

            // Switch projection transform from left to right handed.
            if (this.coordinateSystem == CoordinateSystem.RIGHT_HANDED)
                raw[5] = -raw[5];

            this._projection.copyRawDataFrom(raw);

            this._projectionInvalid = false;
        }
    }
    /**
     * 临时矩阵数据
     */
    var tempRawData = new Float32Array(16);
}
