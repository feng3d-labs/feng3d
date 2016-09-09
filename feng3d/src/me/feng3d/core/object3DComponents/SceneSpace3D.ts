module me.feng3d {

    /**
     * 3D对象场景空间
     * @author feng 2016-09-02
     */
    export class SceneSpace3D extends Object3DComponent {

        /**
         * 构建3D对象场景空间
         */
        constructor() {
            super();
            this.sceneSpace3DDirty = true;
            this.addEventListener(ComponentEvent.ADDED_COMPONENT, this.onBeAddedComponent, this);
        }

        /**
         * 场景空间变换矩阵
         */
        public get sceneTransform3D(): Matrix3D {
            this.sceneSpace3DDirty && this.updateSceneSpace3D();
            return this.sceneSpace3D.transform3D;
        }


        //------------------------------------------
        //@protected
        //------------------------------------------

        protected onBeAddedComponent(event: ComponentEvent): void {

            this.object3D
        }

        //------------------------------------------
        //@private
        //------------------------------------------
        /**
         * 相对场景空间
         */
        private sceneSpace3D: Space3D = new Space3D();
        /**
         * 场景空间是否变脏
         */
        private sceneSpace3DDirty: boolean;

        /**
         * 更新场景空间
         */
        private updateSceneSpace3D() {

            this.sceneSpace3DDirty = false;
            var transform3D = this.object3D.space3D.transform3D.clone();
            var parent = Container3D.getParent(this.object3D);
            if (parent != null) {
                var parentSceneTransform3D = parent.getComponentByClass(SceneSpace3D).sceneTransform3D;
                transform3D.append(parentSceneTransform3D);
            }
            this.sceneSpace3D.transform3D = transform3D;
        }
    }
}