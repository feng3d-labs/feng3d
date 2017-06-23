namespace feng3d
{
	/**
	 * Position, rotation and scale of an object.
     * 
	 * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
	 */
    export class Transform extends ObjectContainer3D
    {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean = true;

        public _pickingCollisionVO: PickingCollisionVO;

        private _worldBounds: BoundingVolumeBase;
        private _worldBoundsInvalid: boolean = true;

        /**
         * 是否为公告牌（默认永远朝向摄像机），默认false。
         */
        public isBillboard = false;
        /**
         * 保持缩放尺寸
         */
        public holdSize = NaN;

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor()
        {
            super();

            this._updateEverytime = true;

            this._bounds = this.getDefaultBoundingVolume();
            this._worldBounds = this.getDefaultBoundingVolume();
            this._bounds.addEventListener(Event.CHANGE, this.onBoundsChange, this);
            //
            this.createUniformData("u_modelMatrix", () => this.localToWorldMatrix);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this.isBillboard)
            {
                var parentInverseSceneTransform = (this.parent && this.parent.worldToLocalMatrix) || new Matrix3D();
                var cameraPos = parentInverseSceneTransform.transformVector(renderContext.camera.sceneTransform.position);
                var yAxis = parentInverseSceneTransform.deltaTransformVector(Vector3D.Y_AXIS);
                this.lookAt(cameraPos, yAxis);
            }
            if (this.holdSize)
            {
                var depthScale = this.getDepthScale(renderContext);
                var vec = this.localToWorldMatrix.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                this.localToWorldMatrix.recompose(vec);
            }
            super.updateRenderData(renderContext, renderData);
        }

        private getDepthScale(renderContext: RenderContext)
        {
            var cameraTranform = renderContext.camera.sceneTransform;
            var distance = this.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = renderContext.view3D.getScaleByDepth(depth);
            return scale;
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
		 * 获取碰撞数据
		 */
        public get pickingCollisionVO(): PickingCollisionVO
        {
            if (!this._pickingCollisionVO)
                this._pickingCollisionVO = new PickingCollisionVO(this.gameObject);

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

            this.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);

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
            this._worldBounds.transformFrom(this.bounds, this.localToWorldMatrix);
            this._worldBoundsInvalid = false;
        }

        /**
         * 处理包围盒变换事件
         */
        protected onBoundsChange()
        {
            this._worldBoundsInvalid = true;
        }

        /**
		 * @inheritDoc
		 */
        protected updateBounds()
        {
            var meshFilter = this.gameObject.getComponent(MeshFilter);
            this._bounds.geometry = meshFilter.mesh;
            this._bounds.fromGeometry(meshFilter.mesh);
            this._boundsInvalid = false;
        }

		/**
		 * 碰撞前设置碰撞状态
		 * @param shortestCollisionDistance 最短碰撞距离
		 * @param findClosest 是否寻找最优碰撞
		 * @return
		 */
        public collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean
        {
            pickingCollider.setLocalRay(this._pickingCollisionVO.localRay);
            this._pickingCollisionVO.renderable = null;

            var meshFilter = this.gameObject.getComponent(MeshFilter);
            var model = meshFilter.mesh;

            if (pickingCollider.testSubMeshCollision(model, this._pickingCollisionVO, shortestCollisionDistance))
            {
                shortestCollisionDistance = this._pickingCollisionVO.rayEntryDistance;
                this._pickingCollisionVO.renderable = model;
                if (!findClosest)
                    return true;
            }

            return this._pickingCollisionVO.renderable != null;
        }
    }
}
