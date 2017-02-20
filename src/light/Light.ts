module feng3d
{

    /**
     * 灯光
     * @author feng 2016-12-12
     */
    export class Light extends Object3DComponent
    {

        /**
         * 灯光类型
         */
        public type: LightType;

        /**
         * 颜色
         */
        public color: Color = new Color();

        /**
         * 光照强度
         */
        public intensity: number = 1;

        /**
         * 灯光位置
         */
        public get position()
        {

            return this.object3D.transform.globalPosition;
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void
        {

            this.object3D.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene)
            {
                this.object3D.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_LIGHT_TO_SCENE, { light: this }));
            }
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void
        {

            this.object3D.removeEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.removeEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene)
            {
                this.object3D.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, { light: this }));
            }
        }

        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event: Scene3DEvent)
        {

            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED_LIGHT_TO_SCENE, { light: this }));
        }

        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event: Scene3DEvent)
        {

            event.data.scene.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, { light: this }));
        }
    }
}