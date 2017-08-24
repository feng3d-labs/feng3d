declare namespace feng3d {
    /**
     * 镜头事件
     */
    interface LensEventMap {
        matrixChanged: any;
    }
    interface LensBase {
        once<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof LensEventMap>(type: K, data?: LensEventMap[K], bubbles?: boolean): any;
        has<K extends keyof LensEventMap>(type: K): boolean;
        on<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof LensEventMap>(type?: K, listener?: (event: LensEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    abstract class LensBase extends Event {
        /**
         * 最近距离
         */
        private _near;
        near: number;
        /**
         * 最远距离
         */
        private _far;
        far: number;
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        private _aspectRatio;
        aspectRatio: number;
        protected _matrix: Matrix3D;
        protected _scissorRect: Rectangle;
        protected _viewPort: Rectangle;
        protected _frustumCorners: number[];
        private _unprojection;
        /**
         * 创建一个摄像机镜头
         */
        constructor();
        /**
         * Retrieves the corner points of the lens frustum.
         */
        frustumCorners: number[];
        /**
         * 投影矩阵
         */
        matrix: Matrix3D;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3D, v?: Vector3D): Vector3D;
        /**
         * 投影逆矩阵
         */
        readonly unprojectionMatrix: Matrix3D;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): any;
    }
}
