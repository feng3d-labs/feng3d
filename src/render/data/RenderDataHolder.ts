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

        public collectRenderDataHolder(renderData: RenderData = null)
        {
            renderData.addRenderDataHolder(this);
            this.components_.forEach(element =>
            {
                if (element instanceof RenderDataHolder)
                {
                    element.collectRenderDataHolder(renderData);
                }
            });
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {

        }
    }
}