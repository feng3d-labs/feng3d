declare namespace feng3d {
    /**
     * @author feng 2014-10-14
     */
    interface CameraEventMap extends ComponentEventMap {
        lensChanged: any;
    }
    interface Camera {
        once<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof CameraEventMap>(type: K, data?: CameraEventMap[K], bubbles?: boolean): any;
        has<K extends keyof CameraEventMap>(type: K): boolean;
        on<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof CameraEventMap>(type?: K, listener?: (event: CameraEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera extends Component {
        private _lens;
        private _viewProjection;
        private _viewProjectionDirty;
        private _frustumPlanes;
        private _frustumPlanesDirty;
        private _viewRect;
        /**
         * 视窗矩形
         */
        viewRect: Rectangle;
        readonly single: boolean;
        /**
         * 创建一个摄像机
         */
        constructor(gameObject: GameObject);
        /**
         * 处理镜头变化事件
         */
        private onLensMatrixChanged(event);
        /**
         * 镜头
         */
        lens: LensBase;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        readonly viewProjection: Matrix3D;
        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged(): void;
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        getMouseRay3D(): Ray3D;
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        getRay3D(x: number, y: number, ray3D?: Ray3D): Ray3D;
        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        project(point3d: Vector3D): Vector3D;
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(sX: number, sY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        screenToGpuPosition(screenPos: Point): Point;
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number): number;
        /**
         * 视锥体面
         */
        readonly frustumPlanes: Plane3D[];
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        private updateFrustum();
    }
}
