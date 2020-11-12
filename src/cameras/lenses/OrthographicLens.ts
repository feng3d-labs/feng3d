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
        @watch("invalidate")
        size: number;

        /**
         * 构建正射投影镜头
         * @param size 尺寸
         */
        constructor(size = 1, aspect = 1, near = 0.3, far = 1000)
        {
            super(aspect, near, far);
            this._projectionType = Projection.Orthographic;
            this.size = size;
        }

        protected _updateMatrix()
        {
            this._matrix.setOrtho(-this.size, this.size, this.size, -this.size, this.near, this.far);
        }

        clone()
        {
            return new OrthographicLens(this.size, this.aspect, this.near, this.far);
        }
    }
}