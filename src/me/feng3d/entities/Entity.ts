module feng3d {

	/**
	 * Entity为所有场景绘制对象提供一个基类，表示存在场景中。可以被entityCollector收集。
	 * @author feng 2014-3-24
	 */
    export abstract class Entity extends Container3D {
        private _showBounds: boolean;
        private _partitionNode: EntityNode;
        private _boundsIsShown: boolean = false;

        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean = true;

        public _pickingCollisionVO: PickingCollisionVO;
        public _pickingCollider: IPickingCollider;

        private _worldBounds: BoundingVolumeBase;
        private _worldBoundsInvalid: boolean = true;

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor() {
            super();

            this._bounds = this.getDefaultBoundingVolume();
            this._worldBounds = this.getDefaultBoundingVolume();
        }

		/**
		 * 是否显示边界
		 */
        public get showBounds(): boolean {
            return this._showBounds;
        }

        public set showBounds(value: boolean) {
            if (value == this._showBounds)
                return;

            this._showBounds = value;

            if (this._showBounds)
                this.addBounds();
            else
                this.removeBounds();
        }

		/**
		 * 添加边界
		 */
        private addBounds() {
            if (!this._boundsIsShown) {
                this._boundsIsShown = true;
                this.addChild(this.bounds.boundingRenderable);
            }
        }

		/**
		 * 移除边界
		 */
        private removeBounds(): void {
            if (this._boundsIsShown) {
                this._boundsIsShown = false;
                this.removeChild(this._bounds.boundingRenderable);
                this._bounds.disposeRenderable();
            }
        }

		/**
		 * @inheritDoc
		 */
        public get minX(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.x;
        }

		/**
		 * @inheritDoc
		 */
        public get minY(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.y;
        }

		/**
		 * @inheritDoc
		 */
        public get minZ(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.z;
        }

		/**
		 * @inheritDoc
		 */
        public get maxX(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.x;
        }

		/**
		 * @inheritDoc
		 */
        public get maxY(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.y;
        }

		/**
		 * @inheritDoc
		 */
        public get maxZ(): number {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.z;
        }

		/**
		 * 边界
		 */
        public get bounds(): BoundingVolumeBase {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds;
        }

		/**
		 * @inheritDoc
		 */
        protected invalidateSceneTransform(): void {
            super.invalidateSceneTransform();
            this._worldBoundsInvalid = true;
        }

		/**
		 * 边界失效
		 */
        protected invalidateBounds(): void {
            this._boundsInvalid = true;
        }

		/**
		 * 获取默认边界（默认盒子边界）
		 * @return
		 */
        protected getDefaultBoundingVolume(): BoundingVolumeBase {
            return new AxisAlignedBoundingBox();
        }

		/**
		 * 更新边界
		 */
        protected abstract updateBounds(): void;

		/**
		 * 获取碰撞数据
		 */
        public get pickingCollisionVO(): PickingCollisionVO {
            if (!this._pickingCollisionVO)
                this._pickingCollisionVO = new PickingCollisionVO(this);

            return this._pickingCollisionVO;
        }

		/**
		 * 判断射线是否穿过实体
		 * @param ray3D
		 * @return
		 */
        public isIntersectingRay(ray3D: Ray3D): boolean {
            if (!this.pickingCollisionVO.localNormal)
                this.pickingCollisionVO.localNormal = new Vector3D();

            //转换到当前实体坐标系空间
            var localRay: Ray3D = this.pickingCollisionVO.localRay;

            localRay.position = this.inverseSceneTransform.transformVector(ray3D.position);
            localRay.direction = this.inverseSceneTransform.deltaTransformVector(ray3D.direction);

            //检测射线与边界的碰撞
            var rayEntryDistance: number = this.bounds.rayIntersection(localRay, this.pickingCollisionVO.localNormal);
            if (rayEntryDistance < 0)
                return false;

            //保存碰撞数据
            this.pickingCollisionVO.rayEntryDistance = rayEntryDistance;
            this.pickingCollisionVO.ray3D = ray3D;
            this.pickingCollisionVO.rayOriginIsInsideBounds = rayEntryDistance == 0;

            return true;
        }

		/**
		 * 获取采集的碰撞
		 */
        public get pickingCollider(): IPickingCollider {
            return this._pickingCollider;
        }

        public set pickingCollider(value: IPickingCollider) {
            this._pickingCollider = value;
        }

		/**
		 * 碰撞前设置碰撞状态
		 * @param shortestCollisionDistance 最短碰撞距离
		 * @param findClosest 是否寻找最优碰撞
		 * @return
		 */
        public collidesBefore(shortestCollisionDistance: number, findClosest: boolean): boolean {
            return true;
        }

		/**
		 * @inheritDoc
		 */
        public set implicitPartition(value: Partition3D) {
            if (value == this._implicitPartition)
                return;

            if (this._implicitPartition)
                this.notifyPartitionUnassigned();

            super.implicitPartition = value;

            this.notifyPartitionAssigned();
        }

		/**
		 * 通知场景一个新分区已分配
		 */
        private notifyPartitionAssigned(): void {
            if (this._scene)
                this._scene.registerPartition(this);
        }

		/**
		 * 通知场景一个分区取消分配
		 */
        private notifyPartitionUnassigned(): void {
            if (this._scene)
                this._scene.unregisterPartition(this);
        }

		/**
		 * @inheritDoc
		 */
        public set scene(value: Scene3D) {
            if (value == this._scene)
                return;

            if (this._scene)
                this._scene.unregisterEntity(this);

            if (value)
                value.registerEntity(this);

            super.scene = value;
        }

		/**
		 * 获取实体分区节点
		 */
        public getEntityPartitionNode(): EntityNode {
            if (this._partitionNode == null) {
                this._partitionNode = this.createEntityPartitionNode();
            }
            return this._partitionNode;
        }

		/**
		 * 创建实体分区节点，该函数为虚函数，需要子类重写。
		 */
        protected abstract createEntityPartitionNode(): EntityNode;

		/**
		 * 内部更新
		 */
        public internalUpdate(): void {
            if (this._controller)
                this._controller.update();
        }

		/**
		 * 世界边界
		 */
        public get worldBounds(): BoundingVolumeBase {
            if (this._worldBoundsInvalid)
                this.updateWorldBounds();

            return this._worldBounds;
        }

		/**
		 * 更新世界边界
		 */
        private updateWorldBounds(): void {
            this._worldBounds.transformFrom(this.bounds, this.sceneTransform);
            this._worldBoundsInvalid = false;
        }

		/**
		 * The transformation matrix that transforms from model to world space, adapted with any special operations needed to render.
		 * For example, assuring certain alignedness which is not inherent in the scene transform. By default, this would
		 * return the scene transform.
		 */
        public getRenderSceneTransform(camera: Camera3D): Matrix3D {
            return this.sceneTransform;
        }
    }
}
