module feng3d
{
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    export class Model extends Object3DComponent
    {
        /**
         * 几何体
         */
        public geometry: Geometry;
        /**
         * 材质
         */
        public material: Material;

        /**
         * 构建
         */
        constructor()
        {
            super();
            this._single = true;

            Watcher.watch(this, ["geometry"], this.invalidateRenderHolder, this);
            Watcher.watch(this, ["material"], this.invalidateRenderHolder, this);
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            var material = this.material || engine.defaultMaterial;
            var geometry = this.geometry || engine.defaultGeometry;
            geometry && geometry.collectRenderDataHolder(renderAtomic);
            material && material.collectRenderDataHolder(renderAtomic);
            super.collectRenderDataHolder(renderAtomic);
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {
            this.parentComponent.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.parentComponent.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.parentComponent.scene)
            {
                this.parentComponent.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
            }
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {
            this.parentComponent.removeEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.parentComponent.removeEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.parentComponent.scene)
            {
                this.parentComponent.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
            }
        }

        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event: Scene3DEvent)
        {
            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
        }

        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event: Scene3DEvent)
        {
            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
        }
    }
}