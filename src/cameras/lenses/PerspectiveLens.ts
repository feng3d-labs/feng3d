namespace feng3d
{

	/**
	 * 透视摄像机镜头
	 */
    export class PerspectiveLens extends LensBase
    {
        /**
		 * 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
		 */
        @watch("invalidate")
        @serialize
        @oav()
        fov: number;

		/**
		 * 创建一个透视摄像机镜头
		 * @param fov 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
         * 
		 */
        constructor(fov = 60, aspect = 1, near = 0.3, far = 1000)
        {
            super(aspect, near, far);
            this._projectionType = Projection.Perspective;
            this.fov = fov;
        }

		/**
		 * 焦距
		 */
        get focalLength(): number
        {
            return 1 / Math.tan(this.fov * Math.PI / 360);
        }

        set focalLength(value: number)
        {
            this.fov = Math.atan(1 / value) * 360 / Math.PI;
        }

		/**
         * 投影
         * 
		 * 摄像机空间坐标投影到GPU空间坐标
         * 
		 * @param point3d 摄像机空间坐标
		 * @param v GPU空间坐标
		 * @return GPU空间坐标
		 */
        project(point3d: Vector3, v = new Vector3()): Vector3
        {
            var v4 = this.matrix.transformVector4(Vector4.fromVector3(point3d, 1));
            // 透视投影结果中w!=1，需要标准化齐次坐标
            v4.scale(1 / v4.w);
            v4.toVector3(v);
            return v;
        }

		/**
         * 逆投影
         * 
		 * GPU空间坐标投影到摄像机空间坐标
         * 
		 * @param point3d GPU空间坐标
		 * @param v 摄像机空间坐标（输出）
		 * @returns 摄像机空间坐标
		 */
        unproject(point3d: Vector3, v = new Vector3())
        {
            // ！！该计算过程需要参考或者研究透视投影矩阵
            // 初始化齐次坐标
            var p4 = Vector4.fromVector3(point3d, 1);
            // 逆投影求出深度值
            var v4 = this.inverseMatrix.transformVector4(p4);
            var sZ = 1 / v4.w;
            // 齐次坐标乘以深度值获取真实的投影结果
            var p44 = p4.scaleTo(sZ);
            // 计算逆投影
            var v44 = this.inverseMatrix.transformVector4(p44);
            // 输出3维坐标
            v44.toVector3(v);
            return v;
        }

        protected _updateMatrix()
        {
            this._matrix.setPerspectiveFromFOV(this.fov, this.aspect, this.near, this.far);
        }

        clone()
        {
            return new PerspectiveLens(this.fov, this.aspect, this.near, this.far);
        }
    }
}
