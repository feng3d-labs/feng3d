namespace feng3d
{
    export class OrthographicLens extends LensBase
    {
        zoom = 1;
        view = {
            enabled: true,
            fullWidth: 1,
            fullHeight: 1,
            offsetX: 0,
            offsetY: 0,
            width: 1,
            height: 1
        };

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

        setViewOffset(fullWidth, fullHeight, x, y, width, height)
        {
            this.view.enabled = true;
            this.view.fullWidth = fullWidth;
            this.view.fullHeight = fullHeight;
            this.view.offsetX = x;
            this.view.offsetY = y;
            this.view.width = width;
            this.view.height = height;

            this.invalidateMatrix();
        }

        clearViewOffset()
        {
            if (this.view !== null)
            {
                this.view.enabled = false;
            }
            this.invalidateMatrix();
        }

        protected updateMatrix()
        {
            var matrix = this._matrix = new Matrix4x4();
            var dx = (this.right - this.left) / (2 * this.zoom);
            var dy = (this.top - this.bottom) / (2 * this.zoom);
            var cx = (this.right + this.left) / 2;
            var cy = (this.top + this.bottom) / 2;

            var left = cx - dx;
            var right = cx + dx;
            var top = cy + dy;
            var bottom = cy - dy;

            if (this.view !== null && this.view.enabled)
            {
                var zoomW = this.zoom / (this.view.width / this.view.fullWidth);
                var zoomH = this.zoom / (this.view.height / this.view.fullHeight);
                var scaleW = (this.right - this.left) / this.view.width;
                var scaleH = (this.top - this.bottom) / this.view.height;

                left += scaleW * (this.view.offsetX / zoomW);
                right = left + scaleW * (this.view.width / zoomW);
                top -= scaleH * (this.view.offsetY / zoomH);
                bottom = top - scaleH * (this.view.height / zoomH);
            }
            matrix.setOrtho(left, right, top, bottom, this.near, this.far);
        }

		/**
		 * 屏幕坐标投影到摄像机空间坐标
		 * @param nX 屏幕坐标X -1（左） -> 1（右）
		 * @param nY 屏幕坐标Y -1（上） -> 1（下）
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        unproject(nX: number, nY: number, sZ: number, v?: Vector3)
        {
            return null;
        }
    }
}