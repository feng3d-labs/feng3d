module feng3d {

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Object3D {

        private _renderables: Object3D[] = [];

        /**
         * 构造3D场景
         */
        constructor() {

            super("root");
            this.addEventListener(Object3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this)
            this.addEventListener(Object3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this)
        }

        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event: Object3DEvent) {

            this._renderables.push(event.data.object3d);
        }

        /**
         * 处理添加对象事件
         */
        private onRemovedFromScene(event: Object3DEvent) {

            var removedChild = event.data.object3d;
            var index = this._renderables.indexOf(removedChild);
            this._renderables.splice(index, 1);
        }

        /**
        * 获取可渲染对象列表
        */
        getRenderables(): Object3D[] {

            return this._renderables;
        }
    }
}