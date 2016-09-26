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

            this.object3D.addEventListener(Space3DEvent.TRANSFORM_CHANGED, this.onTransformChanged, this);
        }

        /**
		 * 使变换矩阵失效，场景变换矩阵也将失效
		 */
        protected onTransformChanged(event: Space3DEvent) {

            this.notifySceneTransformChange();
        }

        /**
		 * 通知场景变换改变
		 */
        public notifySceneTransformChange() {

            if (this.sceneSpace3DDirty)
                return;

            var sceneTransformChanged = new SceneSpace3DEvent(SceneSpace3DEvent.SCENETRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(sceneTransformChanged);

            if (this.object3D && this.object3D) {

                for (var i = 0; i < this.object3D.numChildren; i++) {
                    var element = this.object3D.getChildAt(i)
                    element.notifySceneTransformChange();
                }
            }

            this.invalidateSceneTransform();
        }

		/**
		 * 场景变化失效
		 */
        protected invalidateSceneTransform() {

            this.sceneSpace3DDirty = true;
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
            var parent = this.object3D.parent;
            if (parent != null) {
                var parentSceneTransform3D = parent.sceneTransform3D;
                transform3D.append(parentSceneTransform3D);
            }
            this.sceneSpace3D.transform3D = transform3D;
        }
    }

    /**
	 * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
	 * @author feng 2014-3-31
	 */
    export class SceneSpace3DEvent extends Event {

		/**
		 * 场景变换矩阵发生变化
		 */
        public static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";

		/**
		 * 发出事件的3D元素
		 */
        data: SceneSpace3D;
    }
}