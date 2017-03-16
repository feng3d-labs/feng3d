module feng3d
{
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    export class Model extends Object3DComponent
    {
        private _geometry: Geometry;
        private _material: Material;

        /**
         * 几何体
         */
        public get geometry(): Geometry
        {
            return this._geometry;
        }

        public set geometry(value: Geometry)
        {
            this._geometry && this.removeComponent(this._geometry);
            this._geometry = value;
            this._geometry && this.addComponent(this._geometry);
        }

        /**
         * 材质
         */
        public get material(): Material
        {
            return this._material;
        }

        public set material(value: Material)
        {
            this._material && this.removeComponent(this._material);
            this._material = value;
            this._material && this.addComponent(this._material);
        }

        constructor()
        {
            super();
            this._single = true;
            this.material = new ColorMaterial();
        }

        public collectRenderDataHolder(renderData: RenderData = null)
        {
            super.collectRenderDataHolder(renderData);
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