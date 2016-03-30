module feng3d {

	/**
	 * 分区节点基类
	 * @author feng 2015-3-8
	 */
    export class NodeBase {
        protected _childNodes: NodeBase[];
        protected _numChildNodes: number;
        protected _debugPrimitive: WireframePrimitiveBase;

		/**
		 * 父分区节点
		 */
        public _parent: NodeBase;

        public _numEntities: number;
        public _collectionMark: number;

		/**
		 * 创建一个分区节点基类
		 */
        public NodeBase() {
            this._childNodes = [];
        }

		/**
		 * 父分区节点
		 */
        public get parent(): NodeBase {
            return this._parent;
        }

		/**
		 * 是否显示调试边界
		 */
        public get showDebugBounds(): boolean {
            return this._debugPrimitive != null;
        }

		/**
		 * @private
		 */
        public set showDebugBounds(value: boolean) {
            if ((this._debugPrimitive != null) == value)
                return;

            if (value)
                this._debugPrimitive = this.createDebugBounds();
            else {
                //				_debugPrimitive.dispose();
                this._debugPrimitive = null;
            }

            for (var i: number = 0; i < this._numChildNodes; ++i)
                this._childNodes[i].showDebugBounds = value;
        }

		/**
		 * 添加节点
		 * @param node	节点
		 */
        public addNode(node: NodeBase): void {
            node._parent = this;
            this._numEntities += node._numEntities;
            this._childNodes[this._numChildNodes++] = node;
            node.showDebugBounds = this._debugPrimitive != null;

            var numEntities: number = node._numEntities;
            node = this;

            do
                node._numEntities += numEntities;
            while ((node = node._parent) != null);
        }

		/**
		 * 移除节点
		 * @param node 节点
		 */
        public removeNode(node: NodeBase): void {
            var index: number = this._childNodes.indexOf(node);
            this._childNodes[index] = this._childNodes[--this._numChildNodes];
            this._childNodes.pop();

            var numEntities: number = node._numEntities;
            node = this;

            do
                node._numEntities -= numEntities;
            while ((node = node._parent) != null);
        }

		/**
		 * 为给定实体查找分区节点
		 * @param entity		实体
		 * @return 				实体所在分区节点
		 */
        public findPartitionForEntity(entity: Entity): NodeBase {
            entity = entity;
            return this;
        }

		/**
		 * 接受横越者
		 * @param traverser		访问节点的横越者
		 */
        public acceptTraverser(traverser: PartitionTraverser): void {
            if (this._numEntities == 0 && !this._debugPrimitive)
                return;

            if (traverser.enterNode(this)) {
                var i: number;
                while (i < this._numChildNodes)
                    this._childNodes[i++].acceptTraverser(traverser);

                if (this._debugPrimitive)
                    traverser.applyRenderable(this._debugPrimitive);
            }
        }

		/**
		 * 创建调试边界
		 */
        protected createDebugBounds(): WireframePrimitiveBase {
            return null;
        }

		/**
		 * 更新多个实体
		 * @param value 数量
		 */
        protected updateNumEntities(value: number): void {
            var diff: number = value - this._numEntities;
            var node: NodeBase = this;

            do
                node._numEntities += diff;
            while ((node = node._parent) != null);
        }

		/**
		 * 测试是否出现在摄像机视锥体内
		 * @param planes		视锥体面向量
		 * @param numPlanes		面数
		 * @return 				true：在视锥体内
		 */
        public isInFrustum(planes: Plane3D[], numPlanes: number): boolean {
            return true;
        }
    }
}
