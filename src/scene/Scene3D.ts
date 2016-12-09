module feng3d {

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends GameObject {

        private _renderables: GameObject[] = [];

        /**
         * 构造3D场景
         */
        constructor() {

            super("root");
            this.transform.addEventListener(Container3DEvent.ADDED, this.onAdded, this)
            this.transform.addEventListener(Container3DEvent.REMOVED, this.onRemoved, this)
        }

        /**
         * 处理添加对象事件
         */
        private onAdded(event: Container3DEvent) {

            this._renderables.push(event.data.child.gameObject);
        }

        /**
         * 处理添加对象事件
         */
        private onRemoved(event: Container3DEvent) {

            var removedChild = event.data.child;
            var index = this._renderables.indexOf(removedChild.gameObject);
            this._renderables.splice(index, 1);
        }

        /**
        * 获取可渲染对象列表
        */
        getRenderables(): GameObject[] {

            return this._renderables;
        }
    }
}