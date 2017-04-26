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

        /**
         * 是否为公告牌（默认永远朝向摄像机），默认false。
         */
        public isBillboard = false;
        public holdSize = NaN;

        public updateRender(renderContext: RenderContext)
        {
            if (this.isBillboard)
            {
                this.lookAt(renderContext.camera.globalMatrix3D.position);
            }
            if (this.holdSize)
            {
                var depthScale = this.getDepthScale(renderContext);
                var vec = this.sceneTransform.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                this.sceneTransform.recompose(vec);
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

        private getDepthScale(renderContext: RenderContext)
        {
            var cameraTranform = renderContext.camera.globalMatrix3D;
            var distance = this.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = renderContext.view3D.getScaleByDepth(depth);
            return scale;
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

        /**
         * 构建3D对象
         */
        constructor(name = "object")
        {
            super();
            this.name = name;
        }

		/**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.uniforms[RenderDataID.u_modelMatrix] = this.sceneTransform;
        }
    }
}