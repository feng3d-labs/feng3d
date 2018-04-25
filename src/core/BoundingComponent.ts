namespace feng3d
{
    /**
     * 包围盒组件
     */
    export class BoundingComponent extends Component
    {
        get single() { return true; }

        showInInspector = false;
        serializable = false;

        private _selfLocalBounds: Box | null;
        private _selfWorldBounds: Box | null;

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            gameObject.on("boundsInvalid", this.onBoundsChange, this);
            gameObject.on("scenetransformChanged", this.invalidateSceneTransform, this);
        }

		/**
		 * 自身局部包围盒
		 */
        get selfLocalBounds()
        {
            if (!this._selfLocalBounds)
                this.updateBounds();

            return this._selfLocalBounds;
        }

		/**
		 * @inheritDoc
		 */
        private invalidateSceneTransform()
        {
            this._selfWorldBounds = null;
        }

        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D)
        {
            if (!this.selfLocalBounds)
                return null;

            var localNormal = new Vector3();

            //转换到当前实体坐标系空间
            var localRay = new Ray3D();

            this.transform.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.transform.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);

            //检测射线与边界的碰撞
            var rayEntryDistance = this.selfLocalBounds.rayIntersection(localRay.position, localRay.direction, localNormal);
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
		 * 自身世界包围盒
		 */
        get selfWorldBounds()
        {
            if (!this._selfWorldBounds)
                this.updateWorldBounds();
 
            return this._selfWorldBounds;
        }

        /**
         * 世界包围盒
         */
        get worldBounds()
        {
            var box = this.selfWorldBounds;
            if (!box) box = new Box(this.transform.position, this.transform.position);
            this.gameObject.children.forEach(element =>
            {
                var ebox = element.getComponent(BoundingComponent).worldBounds;
                box.union(ebox);
            });
            return box;
        }

		/**
		 * 更新世界边界
		 */
        private updateWorldBounds()
        {
            if (this.selfLocalBounds && this.transform.localToWorldMatrix)
            {
                this._selfWorldBounds = this.selfLocalBounds.applyMatrix3DTo(this.transform.localToWorldMatrix);
            }
        }

        /**
         * 处理包围盒变换事件
         */
        private onBoundsChange()
        {
            this._selfLocalBounds = null;
            this._selfWorldBounds = null;
        }

        /**
		 * @inheritDoc
		 */
        private updateBounds()
        {
            var meshRenderer = this.gameObject.getComponent(MeshRenderer);
            if (meshRenderer && meshRenderer.geometry)
                this._selfLocalBounds = meshRenderer.geometry.bounding;
        }
    }
}