namespace feng3d
{
    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends RenderData
    {
        /**
         * 是否每次必须更新
         */
        public get updateEverytime() { return this._updateEverytime; }
        protected _updateEverytime = false;

        public childrenRenderDataHolder: RenderDataHolder[] = [];

		/**
		 * 创建GL数据缓冲
		 */
        constructor()
        {
            super();
        }

        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            renderAtomic.addRenderDataHolder(this);
            for (var i = 0; i < this.childrenRenderDataHolder.length; i++)
            {
                this.childrenRenderDataHolder[i].collectRenderDataHolder(renderAtomic);
            }
        }

        public addRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            if (this.childrenRenderDataHolder.indexOf(renderDataHolder) == -1)
                this.childrenRenderDataHolder.push(renderDataHolder);
            this.dispatchEvent(new Event(Object3DRenderAtomic.ADD_RENDERHOLDER, renderDataHolder));
        }

        public removeRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            var index = this.childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index != -1)
                this.childrenRenderDataHolder.splice(index, 1);
            this.dispatchEvent(new Event(Object3DRenderAtomic.REMOVE_RENDERHOLDER, renderDataHolder));
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
        }
    }
}