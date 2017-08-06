namespace feng3d
{
    /**
	 * @author feng 2014-10-14
	 */
    export interface CameraEventMap extends ComponentEventMap
    {
        lensChanged;
    }

    export interface Camera
    {
        once<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof CameraEventMap>(type: K, data?: CameraEventMap[K], bubbles?: boolean);
        has<K extends keyof CameraEventMap>(type: K): boolean;
        on<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof CameraEventMap>(type?: K, listener?: (event: CameraEventMap[K]) => any, thisObject?: any);
    }

	/**
	 * 摄像机
	 * @author feng 2016-08-16
	 */
    export class Camera extends Component
    {
        private _lens: LensBase;
        private _viewProjection: Matrix3D = new Matrix3D();
        private _viewProjectionDirty = true;
        private _frustumPlanes: Plane3D[];
        private _frustumPlanesDirty = true;
        private _viewRect: Rectangle = new Rectangle(0, 0, 1, 1);

        /**
         * 视窗矩形
         */
        get viewRect()
        {
            return this._viewRect;
        }
        set viewRect(value)
        {
            this._viewRect = value;
        }

        get single() { return true; }

		/**
		 * 创建一个摄像机
		 */
        constructor(gameObject: GameObject)
        {
            super(gameObject);
            this._lens = new PerspectiveLens();
            this._lens.on("matrixChanged", this.onLensMatrixChanged, this);

            this.gameObject.transform.on("scenetransformChanged", this.onScenetransformChanged, this);
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;

            this._frustumPlanes = [];

            for (var i = 0; i < 6; ++i)
                this._frustumPlanes[i] = new Plane3D();

            //
            this.createUniformData("u_viewProjection", () => this.viewProjection);
            this.createUniformData("u_cameraMatrix", () =>
            {
                return this.gameObject ? this.gameObject.transform.localToWorldMatrix : new Matrix3D();
            });
            this.createUniformData("u_skyBoxSize", () => { return this._lens.far / Math.sqrt(3); });
        }

		/**
		 * 处理镜头变化事件
		 */
        private onLensMatrixChanged(event: EventVO<any>)
        {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;

            this.dispatch(<any>event.type, event.data);
        }

        /**
		 * 镜头
		 */
        @serialize
        get lens(): LensBase
        {
            return this._lens;
        }

        set lens(value: LensBase)
        {
            if (this._lens == value)
                return;

            if (!value)
                throw new Error("Lens cannot be null!");

            this._lens.off("matrixChanged", this.onLensMatrixChanged, this);

            this._lens = value;

            this._lens.on("matrixChanged", this.onLensMatrixChanged, this);

            this.dispatch("lensChanged", this);
        }

		/**
		 * 场景投影矩阵，世界空间转投影空间
		 */
        get viewProjection(): Matrix3D
        {
            if (this._viewProjectionDirty)
            {
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(this.transform.worldToLocalMatrix);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }

            return this._viewProjection;
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
		 * 获取鼠标射线（与鼠标重叠的摄像机射线）
		 */
        getMouseRay3D(): Ray3D
        {
            return this.getRay3D(input.clientX - this._viewRect.x, input.clientY - this._viewRect.y);
        }

        /**
		 * 获取与坐标重叠的射线
		 * @param x view3D上的X坐标
		 * @param y view3D上的X坐标
		 * @return
		 */
        getRay3D(x: number, y: number, ray3D: Ray3D = null): Ray3D
        {
            //摄像机坐标
            var rayPosition: Vector3D = this.unproject(x, y, 0);
            //摄像机前方1处坐标
            var rayDirection: Vector3D = this.unproject(x, y, 1);
            //射线方向
            rayDirection.x = rayDirection.x - rayPosition.x;
            rayDirection.y = rayDirection.y - rayPosition.y;
            rayDirection.z = rayDirection.z - rayPosition.z;
            rayDirection.normalize();
            //定义射线
            ray3D = ray3D || new Ray3D(rayPosition, rayDirection);
            return ray3D;
        }

		/**
		 * 投影坐标（世界坐标转换为3D视图坐标）
		 * @param point3d 世界坐标
		 * @return 屏幕的绝对坐标
		 */
        project(point3d: Vector3D): Vector3D
        {
            var v: Vector3D = this.lens.project(this.transform.worldToLocalMatrix.transformVector(point3d));

            v.x = (v.x + 1.0) * this._viewRect.width / 2.0;
            v.y = (v.y + 1.0) * this._viewRect.height / 2.0;

            return v;
        }

        /**
		 * 屏幕坐标投影到场景坐标
		 * @param nX 屏幕坐标X ([0-width])
		 * @param nY 屏幕坐标Y ([0-height])
		 * @param sZ 到屏幕的距离
		 * @param v 场景坐标（输出）
		 * @return 场景坐标
		 */
        unproject(sX: number, sY: number, sZ: number, v: Vector3D = null): Vector3D
        {
            var gpuPos: Point = this.screenToGpuPosition(new Point(sX, sY));
            return this.transform.localToWorldMatrix.transformVector(this.lens.unproject(gpuPos.x, gpuPos.y, sZ, v), v);
        }

        /**
		 * 屏幕坐标转GPU坐标
		 * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
		 * @return GPU坐标 (x:[-1,1],y:[-1-1])
		 */
        screenToGpuPosition(screenPos: Point): Point
        {
            var gpuPos: Point = new Point();
            gpuPos.x = (screenPos.x * 2 - this._viewRect.width) / this._viewRect.width;
            gpuPos.y = (screenPos.y * 2 - this._viewRect.height) / this._viewRect.height;
            return gpuPos;
        }

        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number)
        {
            var centerX = this._viewRect.width / 2;
            var centerY = this._viewRect.height / 2;
            var lt = this.unproject(centerX - 0.5, centerY - 0.5, depth);
            var rb = this.unproject(centerX + 0.5, centerY + 0.5, depth);
            var scale = lt.subtract(rb).length;
            return scale;
        }

		/**
		 * 视锥体面
		 */
        get frustumPlanes(): Plane3D[]
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