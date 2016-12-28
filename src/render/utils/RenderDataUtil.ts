module feng3d {

    /**
     * 渲染数据工具
     * @author feng 2016-05-02
     */
    export class RenderDataUtil {

        /**
         * 激活渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        public static active(renderAtomic: RenderAtomic, renderData: IRenderData) {

            renderData.shaderName && (renderAtomic.shaderName = renderData.shaderName);
        }

        /**
         * 释放渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        public static deactivate(renderAtomic: RenderAtomic, renderData: IRenderData) {

            renderData.shaderName && (renderAtomic.shaderName = null);
        }
    }
}