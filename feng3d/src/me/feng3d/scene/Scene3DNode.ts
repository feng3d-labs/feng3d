module me.feng3d {

    /**
     * 3D场景节点
     */
    export class Scene3DNode extends EventDispatcher {

        /**
         * 父节点
         */
        parent: Scene3DNode = null;

        /**
         * 子节点列表
         */
        children: Scene3DNode[] = [];

        /**
         * 3D对象
         */
        object3D: Object3D;

        /**
         * 构建3D场景节点
         * @param object3D 3D对象
         * @param parent 父节点
         */
        constructor(object3D: Object3D, parent: Scene3DNode) {

            super();
            this.object3D = object3D;
            this.parent = parent;
        }

        /**
         * 节点名称
         */
        get name(): string {
            return this.object3D.name;
        }

        set name(value: string) {
            this.object3D.name = value;
        }

        /**
         * 添加3D对象生成节点
         */
        addObject3D(object3D: Object3D): this {

            var child = new Scene3DNode(object3D, this);
            this.children.push(child);
            this.dispatchEvent(new Scene3DEvent(Scene3DEvent.ADDED, child, true));
            return this;
        }

        /**
         * 移除3D对象节点
         */
        removeObject(object3D: Object3D): this {

            var deletedChild: Scene3DNode;
            for (var i = 0; i < this.children.length; i++) {
                var element = this.children[i];
                if (element.object3D == object3D) {
                    this.children.splice(i, 1);
                    deletedChild = deletedChild;
                    this.dispatchEvent(new Scene3DEvent(Scene3DEvent.REMOVED, deletedChild, true));
                    break;
                }
            }
            return this;
        }

        /**
         * 根据名称深度查找节点
         * @param name 节点名称
         */
        find(name: string): Scene3DNode {

            if (this.name == name) {
                return this;
            }
            for (var i = 0; i < this.children.length; i++) {
                var element = this.children[i];
                var target = element.find(name);
                if (target != null)
                    return target;
            }

            return null;
        }

        /**
         * 是否可渲染
         */
        get renderable(): boolean {
            return this.object3D != null;
        }

        /**
         * 获取可渲染对象列表
         */
        getRenderables(renderables: Object3D[] = null): Object3D[] {

            renderables = renderables || [];
            this.renderable && renderables.push(this.object3D);

            this.children.forEach(element => {
                element.getRenderables(renderables);
            });

            return renderables;
        }
    }
}