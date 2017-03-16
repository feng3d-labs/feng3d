module feng3d
{

    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    export class PointMaterial extends Material
    {

        public pointSize = 1;

        /**
         * 构建颜色材质
         */
        constructor()
        {
            super();
            this.shaderName = "point";
            this.renderMode = RenderMode.POINTS;
            Watcher.watch(this, ["pointSize"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms[RenderDataID.u_PointSize] = this.pointSize;
            super.updateRenderData(renderContext, renderData);
        }
    }
}