module feng3d {

    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    export class MeshRenderer extends Renderer {

        private _material: Material;

        /**
         * 材质
         */
        public get material(): Material {

            return this._material;
        }

        public set material(value: Material) {

            this._material && this.removeComponent(this._material);
            this._material = value;
            this._material && this.addComponent(this._material);
        }

        constructor() {

            super();
            this.material = new ColorMaterial();
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void {

            this.object3D.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
            }
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void {

            this.object3D.removeEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.removeEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
            }
        }

        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event: Scene3DEvent) {

            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
        }

        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event: Scene3DEvent) {

            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
        }
    }
}