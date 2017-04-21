module feng3d
{

    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    export class GameObject extends ObjectContainer3D
    {
        public get renderData() { return this._renderData; }
        private _renderData = new Object3DRenderAtomic();
        /**
		 * 组件列表
		 */
        protected components_: Object3DComponent[] = [];

        //-非序列化
        private _object3DID: number;

        /**
         * 是否为公告牌（默认永远朝向摄像机），默认false。
         */
        public isBillboard = false;

        public updateRender(renderContext: RenderContext)
        {
            if (this.isBillboard)
            {
                this.lookAt(renderContext.camera.globalMatrix3D.position);
            }
            if (this.renderData.renderHolderInvalid)
            {
                this.renderData.clear();
                this.collectRenderDataHolder(this.renderData);
                this.renderData.renderHolderInvalid = false;
            }
            this.updateRenderData(renderContext, this.renderData);
            this.renderData.update(renderContext);
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            this.components_.forEach(element =>
            {
                if (element instanceof RenderDataHolder)
                {
                    element.collectRenderDataHolder(renderAtomic);
                }
            });
        }

        public get object3DID()
        {
            return this._object3DID;
        }

        /**
         * 构建3D对象
         */
        constructor(name = "object")
        {
            super();

            this._object3DID = object3DAutoID++;
            object3DMap[this._object3DID] = this;
            this.name = name;
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.u_objectID] = this._object3DID;
            renderData.uniforms[RenderDataID.u_modelMatrix] = this.sceneTransform;
        }

        public static getObject3D(id: number)
        {
            return object3DMap[id];
        }
    }

    var object3DAutoID = 1;//索引从1开始，因为索引拾取中默认值为0
    var object3DMap: { [id: number]: GameObject } = {};
}