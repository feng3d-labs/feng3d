module feng3d
{
    export class BoundingComponent extends Component
    {
        private _bounds: IBounding | null;
        private _worldBounds: IBounding | null;

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            gameObject.on("boundsInvalid", this.onBoundsChange, this);
            gameObject.on("scenetransformChanged", this.invalidateSceneTransform, this);
        }

		/**
		 * 边界
		 */
        get bounds()
        {
            if (!this._bounds)
                this.updateBounds();

            return this._bounds;
        }

		/**
		 * @inheritDoc
		 */
        private invalidateSceneTransform()
        {
            this._worldBounds = null;
        }

        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D)
        {
            if (!this.bounds)
                return null;

            var localNormal = new Vector3D();

            //转换到当前实体坐标系空间
            var localRay = new Ray3D();

            this.transform.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.transform.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);

            //检测射线与边界的碰撞
            var rayEntryDistance = bounding.rayIntersection(this.bounds, localRay, localNormal);
            if (rayEntryDistance < 0)
                return null;

            //保存碰撞数据
            var pickingCollisionVO: PickingCollisionVO = {
                gameObject: this.gameObject,
                localNormal: localNormal,
                localRay: localRay,
                rayEntryDistance: rayEntryDistance,
                ray3D: ray3D,
                rayOriginIsInsideBounds: rayEntryDistance == 0,
                geometry: this.gameObject.getComponent(MeshRenderer).geometry,
            };

            return pickingCollisionVO;
        }

		/**
		 * 世界边界
		 */
        get worldBounds()
        {
            if (!this._worldBounds)
                this.updateWorldBounds();

            return this._worldBounds;
        }

		/**
		 * 更新世界边界
		 */
        private updateWorldBounds()
        {
            if (this.bounds && this.transform.localToWorldMatrix)
            {
                this._worldBounds = bounding.transform(this.bounds, this.transform.localToWorldMatrix);
            }
        }

        /**
         * 处理包围盒变换事件
         */
        private onBoundsChange()
        {
            this._bounds = null;
            this._worldBounds = null;
        }

        /**
		 * @inheritDoc
		 */
        private updateBounds()
        {
            var meshRenderer = this.gameObject.getComponent(MeshRenderer);
            if (meshRenderer && meshRenderer.geometry)
                this._bounds = meshRenderer.geometry.bounding;
        }
    }
}