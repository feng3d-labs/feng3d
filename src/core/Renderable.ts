namespace feng3d
{
    /**
     * 可渲染组件
     */
    export class Renderable extends Behaviour
    {
        get single() { return true; }

        readonly renderAtomic = new RenderAtomic();

        /**
         * 几何体
         */
        @oav({ component: "OAVPick", tooltip: "几何体，提供模型以形状", componentParam: { accepttype: "geometry", datatype: "geometry" } })
        @serialize
        @watch("_onGeometryChanged")
        geometry: GeometryLike = Geometry.getDefault("Cube");

        /**
         * 材质
         */
        @oav({ component: "OAVPick", tooltip: "材质，提供模型以皮肤", componentParam: { accepttype: "material", datatype: "material" } })
        @serialize
        @watch("_onMaterialChanged")
        material = Material.getDefault("Default-Material");

        @oav({ tooltip: "是否投射阴影" })
        @serialize
        castShadows = true;

        @oav({ tooltip: "是否接受阴影" })
        @serialize
        receiveShadows = true;

        /**
		 * 自身局部包围盒
		 */
        get selfLocalBounds()
        {
            if (!this._selfLocalBounds)
                this._updateBounds();

            return this._selfLocalBounds;
        }

		/**
		 * 自身世界包围盒
		 */
        get selfWorldBounds()
        {
            if (!this._selfWorldBounds)
                this._updateWorldBounds();

            return this._selfWorldBounds;
        }

        constructor()
        {
            super();
            this._lightPicker = new LightPicker(this);
        }

        init()
        {
            super.init();
            this.on("scenetransformChanged", this._onScenetransformChanged, this);
        }

        /**
         * 渲染前执行函数
         * 
         * 可用于渲染前收集渲染数据，或者更新显示效果等
         * 
         * @param gl 
         * @param renderAtomic 
         * @param scene 
         * @param camera 
         */
        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            //
            this.geometry.beforeRender(renderAtomic);
            this.material.beforeRender(renderAtomic);
            this._lightPicker.beforeRender(renderAtomic);

            this.gameObject.components.forEach(element =>
            {
                if (element != this)
                    element.beforeRender(gl, renderAtomic, scene, camera);
            });
        }

        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3)
        {
            var localNormal = new Vector3();

            //转换到当前实体坐标系空间
            var localRay = new Ray3();

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
                geometry: this.geometry,
                cullFace: this.material.renderParams.cullFace,
            };

            return pickingCollisionVO;
        }

        /**
         * 是否加载完成
         */
        get isLoaded()
        {
            return this.material.isLoaded;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            if (this.isLoaded) callback();
            this.material.onLoadCompleted(callback);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.geometry = <any>null;
            this.material = <any>null;
            super.dispose();
        }

        //
        private _lightPicker: LightPicker;
        private _selfLocalBounds: Box3;
        private _selfWorldBounds: Box3;

        private _onGeometryChanged(property: string, oldValue: GeometryLike, value: GeometryLike)
        {
            if (oldValue)
            {
                oldValue.off("boundsInvalid", this._onBoundsInvalid, this);
            }
            if (value)
            {
                value.on("boundsInvalid", this._onBoundsInvalid, this);
            }
            this.geometry = this.geometry || Geometry.getDefault("Cube");
            this._onBoundsInvalid();
        }

        private _onMaterialChanged()
        {
            this.material = this.material || Material.getDefault("Default-Material");
        }

        private _onScenetransformChanged()
        {
            this._selfWorldBounds = null;
        }

		/**
		 * 更新世界边界
		 */
        private _updateWorldBounds()
        {
            this._selfWorldBounds = this.selfLocalBounds.applyMatrixTo(this.transform.localToWorldMatrix);
        }

        /**
         * 处理包围盒变换事件
         */
        private _onBoundsInvalid()
        {
            this._selfLocalBounds = null;
            this._selfWorldBounds = null;
        }

        private _updateBounds()
        {
            this._selfLocalBounds = this.geometry.bounding;
        }
    }
}