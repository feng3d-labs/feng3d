namespace feng3d
{
    export interface RenderDataHolderEventMap
    {
        /**
         * 添加渲染元素
         */
        addRenderElement;
        /**
         * 移除渲染元素
         */
        removeRenderElement;
        /**
         * 添加渲染数据拥有者
         */
        addRenderHolder;
        /**
         * 移除渲染数据拥有者
         */
        removeRenderHolder;
        /**
         * 渲染数据拥有者数据失效
         */
        invalidateRenderHolder;
    }

    export interface RenderDataHolder
    {
        once<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderDataHolderEventMap>(type: K, data?: RenderDataHolderEventMap[K], bubbles?: boolean);
        has<K extends keyof RenderDataHolderEventMap>(type: K): boolean;
        on<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof RenderDataHolderEventMap>(type?: K, listener?: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any);
    }

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends RenderData
    {
        /**
         * 是否每次必须更新
         */
        get updateEverytime() { return this._updateEverytime; }
        protected _updateEverytime = false;

        childrenRenderDataHolder: RenderDataHolder[] = [];

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
        collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            renderAtomic.addRenderDataHolder(this);
            for (var i = 0; i < this.childrenRenderDataHolder.length; i++)
            {
                this.childrenRenderDataHolder[i].collectRenderDataHolder(renderAtomic);
            }
        }

        addRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            if (this.childrenRenderDataHolder.indexOf(renderDataHolder) == -1)
                this.childrenRenderDataHolder.push(renderDataHolder);
            this.dispatch("addRenderHolder", renderDataHolder);
        }

        removeRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            var index = this.childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index != -1)
                this.childrenRenderDataHolder.splice(index, 1);
            this.dispatch("removeRenderHolder", renderDataHolder);
        }

		/**
		 * 更新渲染数据
		 */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
        }

        invalidate()
        {
            this.dispatch("invalidateRenderHolder", this);
        }

    }
}