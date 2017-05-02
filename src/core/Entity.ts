module feng3d
{
	/**
	 * Entity为所有场景绘制对象提供一个基类，表示存在场景中。可以被entityCollector收集。
	 * @author feng 2014-3-24
	 */
    export abstract class Entity extends ObjectContainer3D
    {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean = true;

        public _pickingCollisionVO: PickingCollisionVO;

        private _worldBounds: BoundingVolumeBase;
        private _worldBoundsInvalid: boolean = true;

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();

            this._bounds = this.getDefaultBoundingVolume();
            this._worldBounds = this.getDefaultBoundingVolume();
            this._bounds.addEventListener(Event.CHANGE, this.onBoundsChange, this);
        }

		/**
		 * @inheritDoc
		 */
        public get minX(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.x;
        }

		/**
		 * @inheritDoc
		 */
        public get minY(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.y;
        }

		/**
		 * @inheritDoc
		 */
        public get minZ(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.z;
        }

		/**
		 * @inheritDoc
		 */
        public get maxX(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.x;
        }

		/**
		 * @inheritDoc
		 */
        public get maxY(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.y;
        }

		/**
		 * @inheritDoc
		 */
        public get maxZ(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.z;
        }

		/**
		 * 边界
		 */
        public get bounds(): BoundingVolumeBase
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds;
        }

		/**
		 * @inheritDoc
		 */
        protected invalidateSceneTransform()
        {
            super.invalidateSceneTransform();
            this._worldBoundsInvalid = true;
        }

		/**
		 * 边界失效
		 */
        protected invalidateBounds()
        {
            this._boundsInvalid = true;
        }

		/**
		 * 获取默认边界（默认盒子边界）
		 * @return
		 */
        protected getDefaultBoundingVolume(): BoundingVolumeBase
        {
            return new AxisAlignedBoundingBox();
        }

		/**
		 * 更新边界
		 */
        protected abstract updateBounds();

		/**
		 * 获取碰撞数据
		 */
        public get pickingCollisionVO(): PickingCollisionVO
        {
            if (!this._pickingCollisionVO)
                this._pickingCollisionVO = new PickingCollisionVO(this);

            return this._pickingCollisionVO;
        }

        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        public isIntersectingRay(ray3D: Ray3D): boolean
        {
            if (!this.pickingCollisionVO.localNormal)
                this.pickingCollisionVO.localNormal = new Vector3D();

            //转换到当前实体坐标系空间
            var localRay: Ray3D = this.pickingCollisionVO.localRay;

            this.inverseSceneTransform.transformVector(ray3D.position, localRay.position);
            this.inverseSceneTransform.deltaTransformVector(ray3D.direction, localRay.direction);

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
		 * 碰撞前设置碰撞状态
		 * @param shortestCollisionDistance 最短碰撞距离
		 * @param findClosest 是否寻找最优碰撞
		 * @return
		 */
        public collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean
        {
            return true;
        }

		/**
		 * 世界边界
		 */
        public get worldBounds(): BoundingVolumeBase
        {
            if (this._worldBoundsInvalid)
                this.updateWorldBounds();

            return this._worldBounds;
        }

		/**
		 * 更新世界边界
		 */
        private updateWorldBounds()
        {
            this._worldBounds.transformFrom(this.bounds, this.sceneTransform);
            this._worldBoundsInvalid = false;
        }

        /**
         * 处理包围盒变换事件
         */
        protected onBoundsChange()
        {
            this._worldBoundsInvalid = true;
        }
    }
}
