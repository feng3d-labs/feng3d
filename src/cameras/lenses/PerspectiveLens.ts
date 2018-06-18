namespace feng3d
{

	/**
	 * 透视摄像机镜头
	 * @author feng 2014-10-14
	 */
    export class PerspectiveLens extends LensBase
    {
        /**
		 * 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
		 */
        @watch("invalidateMatrix")
        @serialize
        @oav()
        fov: number;

		/**
		 * 创建一个透视摄像机镜头
		 * @param fov 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
         * 
		 */
        constructor(fov = 60, aspectRatio = 1, near = 0.3, far = 2000)
        {
            super(aspectRatio, near, far);
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
		 * 摄像机空间坐标投影到GPU空间坐标
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
		 * GPU空间坐标投影到摄像机空间坐标
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
            // 齐次坐标乘以深度值获取真实的投影结果
            var p44 = p4.scaleTo(v4.w);
            // 计算逆投影
            var v44 = this.inverseMatrix.transformVector4(p44);
            // 标准化齐次坐标
            v44.scale(1 / v44.w);
            // 输出3维坐标
            v44.toVector3(v);
            return v;
        }

        unprojectWithDepth(nX: number, nY: number, sZ: number, v = new Vector3()): Vector3
        {
            // 通过投影(0, 0, sZ)获取投影后的GPU空间坐标z值
            var v0 = this.matrix.transformVector4(new Vector4(0, 0, sZ, 1));
            // 初始化真实GPU空间坐标
            var v1 = new Vector4(nX * sZ, nY * sZ, v0.z * sZ, sZ);
            // 计算逆投影
            var v2 = this.inverseMatrix.transformVector4(v1);
            // 输出3维坐标
            v2.toVector3(v);
            return v;
        }

        protected updateMatrix()
        {
            this._matrix.setPerspectiveFromFOV(this.fov, this.aspectRatio, this.near, this.far);
        }
    }
}
