module feng3d
{

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends Component
    {
        /**
         * 是否每次必须更新
         */
        public get updateEverytime() { return this._updateEverytime; }
        protected _updateEverytime = false;

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
            this.components_.forEach(element =>
            {
                if (element instanceof RenderDataHolder)
                {
                    element.collectRenderDataHolder(renderAtomic);
                }
            });
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {

        }

        /**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        public addComponentAt(component: Component, index: number): void
        {
            super.addComponentAt(component, index);
            this.invalidateRenderHolder();
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        public removeComponentAt(index: number): Component
        {
            var component = super.removeComponentAt(index);
            this.invalidateRenderHolder();
            return component;
        }

        protected invalidateRenderData()
        {
            this.dispatchEvent(new Event(Object3DRenderAtomic.INVALIDATE));
        }

        protected invalidateRenderHolder()
        {
            this.dispatchEvent(new Event(Object3DRenderAtomic.INVALIDATE_RENDERHOLDER));
        }
    }

    export interface IRenderDataHolder
    {
        /**
         * 收集渲染数据拥有者
         */
        collectRenderDataHolder(renderAtomic: RenderAtomic);

		/**
		 * 更新渲染数据
		 */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic);
    }
}