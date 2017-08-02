namespace feng3d
{
    export interface Mouse3DEventMap
    {
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        addedToScene

        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        removedFromScene

        mouseout
        mouseover
        mousedown
        mouseup
        mousemove
        click
        dblclick
    }

    export interface TransformEventMap extends Mouse3DEventMap, ComponentEventMap
    {
        /**
         * 显示变化
         */
        visiblityUpdated
        /**
         * 场景矩阵变化
         */
        scenetransformChanged
        /**
         * 场景变化
         */
        sceneChanged
        /**
         * 位置变化
         */
        positionChanged
        /**
         * 旋转变化
         */
        rotationChanged
        /**
         * 缩放变化
         */
        scaleChanged
        /**
         * 变换矩阵变化
         */
        transformChanged
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        added
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removed
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        addedToScene;

        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        removedFromScene;
    }

    export interface Object3D
    {
        once<K extends keyof TransformEventMap>(type: K, listener: (event: TransformEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TransformEventMap>(type: K, data?: TransformEventMap[K], bubbles?: boolean);
        has<K extends keyof TransformEventMap>(type: K): boolean;
        on<K extends keyof TransformEventMap>(type: K, listener: (event: TransformEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof TransformEventMap>(type?: K, listener?: (event: TransformEventMap[K]) => any, thisObject?: any);
    }

	/**
	 * Position, rotation and scale of an object.
     * 
	 * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
	 */
    export class Transform extends ObjectContainer3D
    {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid = true;

        _pickingCollisionVO: PickingCollisionVO;

        private _worldBounds: BoundingVolumeBase;
        private _worldBoundsInvalid = true;

        /**
         * 是否为公告牌（默认永远朝向摄像机），默认false。
         */
        isBillboard = false;
        /**
         * 保持缩放尺寸
         */
        holdSize = NaN;

		/**
		 * 创建一个实体，该类为虚类
		 */
        constructor(gameObject: GameObject)
        {
            super(gameObject);

            this._updateEverytime = true;

            this._bounds = this.getDefaultBoundingVolume();
            this._worldBounds = this.getDefaultBoundingVolume();
            this._bounds.on("change", this.onBoundsChange, this);
            //
            this.createUniformData("u_modelMatrix", () => this.localToWorldMatrix);
        }

        /**
		 * 更新渲染数据
		 */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            var camera = renderContext.camera;
            if (this.isBillboard)
            {
                var parentInverseSceneTransform = (this.parent && this.parent.worldToLocalMatrix) || new Matrix3D();
                var cameraPos = parentInverseSceneTransform.transformVector(camera.transform.localToWorldMatrix.position);
                var yAxis = parentInverseSceneTransform.deltaTransformVector(Vector3D.Y_AXIS);
                this.lookAt(cameraPos, yAxis);
            }
            if (this.holdSize)
            {
                var depthScale = this.getDepthScale(camera);
                var vec = this.localToWorldMatrix.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                this.localToWorldMatrix.recompose(vec);
            }
            super.updateRenderData(renderContext, renderData);
        }

        private getDepthScale(camera: Camera)
        {
            var cameraTranform = camera.transform.localToWorldMatrix;
            var distance = this.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = camera.getScaleByDepth(depth);
            return scale;
        }

		/**
		 * @inheritDoc
		 */
        get minX(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.x;
        }

		/**
		 * @inheritDoc
		 */
        get minY(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.y;
        }

		/**
		 * @inheritDoc
		 */
        get minZ(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.min.z;
        }

		/**
		 * @inheritDoc
		 */
        get maxX(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.x;
        }

		/**
		 * @inheritDoc
		 */
        get maxY(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.y;
        }

		/**
		 * @inheritDoc
		 */
        get maxZ(): number
        {
            if (this._boundsInvalid)
                this.updateBounds();

            return this._bounds.max.z;
        }

		/**
		 * 边界
		 */
        get bounds(): BoundingVolumeBase
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
        get pickingCollisionVO(): PickingCollisionVO
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
        isIntersectingRay(ray3D: Ray3D): boolean
        {
            var meshFilter = this.gameObject.getComponent(MeshFilter);
            if (!meshFilter || !meshFilter.mesh)
                return false;

            if (!this.pickingCollisionVO.localNormal)
                this.pickingCollisionVO.localNormal = new Vector3D();

            //转换到当前实体坐标系空间
            var localRay: Ray3D = this.pickingCollisionVO.localRay;

            this.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);

            //检测射线与边界的碰撞
            var rayEntryDistance = this.bounds.rayIntersection(localRay, this.pickingCollisionVO.localNormal);
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
        get worldBounds(): BoundingVolumeBase
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
        collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean
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
