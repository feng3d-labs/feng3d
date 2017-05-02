module feng3d
{
	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera extends Object3DComponent
    {
        private _viewProjection: Matrix3D = new Matrix3D();
        private _viewProjectionDirty: boolean = true;
        private _lens: LensBase;
        private _frustumPlanes: Plane3D[];
        private _frustumPlanesDirty: boolean = true;

		/**
		 * 创建一个摄像机
		 * @param lens 摄像机镜头
		 */
        constructor(lens: LensBase = null)
        {
            super();
            this._single = true;
            this._lens = lens || new PerspectiveLens();
            this._lens.addEventListener(LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);

            this._frustumPlanes = [];

            for (var i: number = 0; i < 6; ++i)
                this._frustumPlanes[i] = new Plane3D();
        }

		/**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: LensEvent)
        {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;

            this.dispatchEvent(event);
        }

        /**
		 * 镜头
		 */
        public get lens(): LensBase
        {
            return this._lens;
        }

        public set lens(value: LensBase)
        {
            if (this._lens == value)
                return;

            if (!value)
                throw new Error("Lens cannot be null!");

            this._lens.removeEventListener(LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);

            this._lens = value;

            this._lens.addEventListener(LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);

            this.dispatchEvent(new CameraEvent(CameraEvent.LENS_CHANGED, this));
        }

		/**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        public get viewProjection(): Matrix3D
        {
            if (this._viewProjectionDirty)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
        }

        public get inverseSceneTransform()
        {
            return this.parentComponent ? this.parentComponent.inverseSceneTransform : new Matrix3D();
        }

        public get sceneTransform()
        {
            return this.parentComponent ? this.parentComponent.sceneTransform : new Matrix3D();
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
            return this.sceneTransform.transformVector(this.lens.unproject(nX, nY, sZ, v), v);
        }

		/**
		 * 场景坐标投影到屏幕坐标
		 * @param point3d 场景坐标
		 * @param v 屏幕坐标（输出）
		 * @return 屏幕坐标
		 */
        public project(point3d: Vector3D, v: Vector3D = null): Vector3D
        {
            return this.lens.project(this.inverseSceneTransform.transformVector(point3d, v), v);
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {
            this.parentComponent.addEventListener(Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {
            this.parentComponent.removeEventListener(Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        }

        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged()
        {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.u_viewProjection] = this.viewProjection;
            var globalMatrix3d = this.parentComponent ? this.parentComponent.sceneTransform : new Matrix3D();
            renderData.uniforms[RenderDataID.u_cameraMatrix] = globalMatrix3d;
            //
            renderData.uniforms[RenderDataID.u_skyBoxSize] = this._lens.far / Math.sqrt(3);
            super.updateRenderData(renderContext, renderData);
        }

		/**
		 * 视锥体面
		 */
        public get frustumPlanes(): Plane3D[]
        {
            if (this._frustumPlanesDirty)
                this.updateFrustum();

            return this._frustumPlanes;
        }

		/**
		 * 更新视锥体6个面，平面均朝向视锥体内部
		 * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
		 */
        private updateFrustum()
        {
            var a: number, b: number, c: number;
            //var d :number;
            var c11: number, c12: number, c13: number, c14: number;
            var c21: number, c22: number, c23: number, c24: number;
            var c31: number, c32: number, c33: number, c34: number;
            var c41: number, c42: number, c43: number, c44: number;
            var p: Plane3D;
            var raw = Matrix3D.RAW_DATA_CONTAINER;
            //长度倒数
            var invLen: number;
            this.viewProjection.copyRawDataTo(raw);

            c11 = raw[0];
            c12 = raw[4];
            c13 = raw[8];
            c14 = raw[12];
            c21 = raw[1];
            c22 = raw[5];
            c23 = raw[9];
            c24 = raw[13];
            c31 = raw[2];
            c32 = raw[6];
            c33 = raw[10];
            c34 = raw[14];
            c41 = raw[3];
            c42 = raw[7];
            c43 = raw[11];
            c44 = raw[15];

            // left plane
            p = this._frustumPlanes[0];
            a = c41 + c11;
            b = c42 + c12;
            c = c43 + c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c14) * invLen;

            // right plane
            p = this._frustumPlanes[1];
            a = c41 - c11;
            b = c42 - c12;
            c = c43 - c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c14 - c44) * invLen;

            // bottom
            p = this._frustumPlanes[2];
            a = c41 + c21;
            b = c42 + c22;
            c = c43 + c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c24) * invLen;

            // top
            p = this._frustumPlanes[3];
            a = c41 - c21;
            b = c42 - c22;
            c = c43 - c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c24 - c44) * invLen;

            // near
            p = this._frustumPlanes[4];
            a = c31;
            b = c32;
            c = c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -c34 * invLen;

            // far
            p = this._frustumPlanes[5];
            a = c41 - c31;
            b = c42 - c32;
            c = c43 - c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c34 - c44) * invLen;

            this._frustumPlanesDirty = false;
        }
    }
}