namespace feng3d
{
    /**
     * 正射投影镜头
     */
    export class OrthographicLens extends LensBase
    {
        /**
         * 尺寸
         */
        @serialize
        @oav()
        get size()
        {
            return this._size;
        }
        set size(v)
        {
            if (this._size == v) return;
            this._size = v;
            this.invalidate();
        }
        private _size: number;

        /**
         * 构建正射投影镜头
         * @param size 尺寸
         */
        constructor(size = 1, aspect = 1, near = 0.3, far = 1000)
        {
            super(aspect, near, far);
            this.size = size;
        }

        protected updateMatrix()
        {
            this._matrix.setOrtho(-this._size, this._size, this._size, -this._size, this.near, this.far);
        }

        protected updateViewBox()
        {
            var left = -this._size * this.aspect;
            var right = this._size * this.aspect;
            var top = this._size;
            var bottom = -this._size;
            var near = this.near;
            var far = this.far;

            this._viewBox.fromPoints([
                new Vector3(left, bottom, near),
                new Vector3(left, bottom, far),
                new Vector3(left, top, near),
                new Vector3(left, top, far),
                new Vector3(right, bottom, near),
                new Vector3(right, bottom, far),
                new Vector3(right, top, near),
                new Vector3(right, top, far),
            ]);
        }

        clone()
        {
            return new OrthographicLens(this._size, this.aspect, this.near, this.far);
        }
    }
}