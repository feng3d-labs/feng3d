declare namespace feng3d {
    interface BoundingVolumeBaseEventMap {
        change: any;
    }
    interface BoundingVolumeBase extends IEvent<BoundingVolumeBaseEventMap> {
        once<K extends keyof BoundingVolumeBaseEventMap>(type: K, listener: (event: BoundingVolumeBaseEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof BoundingVolumeBaseEventMap>(type: K, data?: BoundingVolumeBaseEventMap[K], bubbles?: boolean): any;
        has<K extends keyof BoundingVolumeBaseEventMap>(type: K): boolean;
        on<K extends keyof BoundingVolumeBaseEventMap>(type: K, listener: (event: BoundingVolumeBaseEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof BoundingVolumeBaseEventMap>(type?: K, listener?: (event: BoundingVolumeBaseEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 包围盒基类
     * @author feng 2014-4-27
     */
    abstract class BoundingVolumeBase extends Event {
        /** 最小坐标 */
        protected _min: Vector3D;
        /** 最大坐标 */
        protected _max: Vector3D;
        protected _aabbPointsDirty: boolean;
        private _geometry;
        /**
         * 用于生产包围盒的几何体
         */
        geometry: Geometry;
        /**
         * The maximum extreme of the bounds
         */
        readonly max: Vector3D;
        /**
         * The minimum extreme of the bounds
         */
        readonly min: Vector3D;
        /**
         * 创建包围盒
         */
        constructor();
        /**
         * 处理几何体包围盒失效
         */
        protected onGeometryBoundsInvalid(): void;
        /**
         * 根据几何结构更新边界
         */
        fromGeometry(geometry: Geometry): void;
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 测试是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @param numPlanes		面数
         * @return 				true：出现在视锥体内
         */
        abstract isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         */
        abstract transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): any;
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        fromSphere(center: Vector3D, radius: number): void;
    }
}
