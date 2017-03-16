module feng3d
{

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends Component
    {
		/**
		 * 创建Context3D数据缓冲
		 */
        constructor()
        {
            super();
        }

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