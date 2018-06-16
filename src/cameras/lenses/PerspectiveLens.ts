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

        

        unproject(nX: number, nY: number, sZ: number, v = new Vector3()): Vector3
        {
            // 由于透视矩阵变换后
            v.init(nX * sZ, nY * sZ, 1);

            this.unprojectionMatrix.transformVector(v, v);

            //z is unaffected by transform
            v.z = sZ;

            var v0 = this.matrix.transformVector4(new Vector4(0, 0, sZ, 1));
            var v1 = new Vector4(nX * sZ, nY * sZ, v0.z * sZ, sZ);
            var v2 = this.unprojectionMatrix.transformVector4(v1);

            v2.toVector3(v);

            return v;
        }

        protected updateMatrix()
        {
            this._matrix.setPerspectiveFromFOV(this.fov * Math.PI / 180, this.aspectRatio, this.near, this.far);
        }
    }
}
