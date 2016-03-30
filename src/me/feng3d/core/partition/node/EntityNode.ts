module feng3d {

	/**
	 * 实体分区节点
	 * @author feng 2015-3-8
	 */
    export class EntityNode extends NodeBase {
		/**
		 * 节点中的实体
		 */
        private _entity: Entity;

		/**
		 * 指向队列中下个更新的实体分区节点
		 */
        public _updateQueueNext: EntityNode;

		/**
		 * 创建一个实体分区节点
		 * @param entity		实体
		 */
        constructor(entity: Entity) {
            super();
            this._entity = entity;
            this._numEntities = 1;
        }

		/**
		 * 从父节点中移除
		 */
        public removeFromParent(): void {
            if (this._parent)
                this._parent.removeNode(this);

            this._parent = null;
        }

		/**
		 * 实体
		 */
        public get entity(): Entity {
            return this._entity;
        }

		/**
		 * @inheritDoc
		 */
        public isInFrustum(planes: Plane3D[], numPlanes: number): boolean {
            if (!this._entity.sceneVisible)
                return false;

            return this._entity.worldBounds.isInFrustum(planes, numPlanes);
        }

    }
}
