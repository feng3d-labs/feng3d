declare namespace feng3d {
    interface TransformEventMap extends ComponentEventMap {
        /**
         * 显示变化
         */
        visiblityUpdated: any;
        /**
         * 场景矩阵变化
         */
        scenetransformChanged: any;
        /**
         * 位置变化
         */
        positionChanged: any;
        /**
         * 旋转变化
         */
        rotationChanged: any;
        /**
         * 缩放变化
         */
        scaleChanged: any;
        /**
         * 变换矩阵变化
         */
        transformChanged: any;
        /**
         *
         */
        updateLocalToWorldMatrix: any;
    }
    interface Object3D {
        once<K extends keyof TransformEventMap>(type: K, listener: (event: EventVO<TransformEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TransformEventMap>(type: K, data?: TransformEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TransformEventMap>(type: K): boolean;
        on<K extends keyof TransformEventMap>(type: K, listener: (event: EventVO<TransformEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TransformEventMap>(type?: K, listener?: (event: EventVO<TransformEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    class Transform extends ObjectContainer3D {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean;
        _pickingCollisionVO: PickingCollisionVO;
        private _worldBounds;
        private _worldBoundsInvalid;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor(gameObject: GameObject);
        /**
         * @inheritDoc
         */
        readonly minX: number;
        /**
         * @inheritDoc
         */
        readonly minY: number;
        /**
         * @inheritDoc
         */
        readonly minZ: number;
        /**
         * @inheritDoc
         */
        readonly maxX: number;
        /**
         * @inheritDoc
         */
        readonly maxY: number;
        /**
         * @inheritDoc
         */
        readonly maxZ: number;
        /**
         * 边界
         */
        readonly bounds: BoundingVolumeBase;
        /**
         * @inheritDoc
         */
        invalidateSceneTransform(): void;
        /**
         * 边界失效
         */
        protected invalidateBounds(): void;
        /**
         * 获取默认边界（默认盒子边界）
         * @return
         */
        protected getDefaultBoundingVolume(): BoundingVolumeBase;
        /**
         * 获取碰撞数据
         */
        readonly pickingCollisionVO: PickingCollisionVO;
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D): boolean;
        /**
         * 世界边界
         */
        readonly worldBounds: BoundingVolumeBase;
        /**
         * 更新世界边界
         */
        private updateWorldBounds();
        /**
         * 处理包围盒变换事件
         */
        protected onBoundsChange(): void;
        /**
         * @inheritDoc
         */
        protected updateBounds(): void;
        /**
         * 碰撞前设置碰撞状态
         * @param shortestCollisionDistance 最短碰撞距离
         * @param findClosest 是否寻找最优碰撞
         * @return
         */
        collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean;
    }
}
