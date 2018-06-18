namespace feng3d
{
    /**
     * 正射投影镜头
     */
    export class OrthographicLens extends LensBase
    {
        isOrthographicCamera = true;

        left: number;
        right: number;
        top: number;
        bottom: number;

        constructor(left: number, right: number, top: number, bottom: number, near = 0.1, far = 2000)
        {
            super();
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;
            this.near = near;
            this.far = far;
        }

        protected updateMatrix()
        {
            var matrix = this._matrix = new Matrix4x4();
            this._matrix = matrix.setOrtho(this.left, this.right, this.top, this.bottom, this.near, this.far);
        }

		/**
		 * 屏幕坐标投影到摄像机空间坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        unprojectWithDepth(nX: number, nY: number, sZ: number, v?: Vector3)
        {
            return null;
        }
    }
}