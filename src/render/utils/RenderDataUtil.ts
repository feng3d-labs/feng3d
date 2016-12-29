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
        public static active(renderAtomic: RenderAtomic, renderData: RenderData) {

            renderData.shaderName && (renderAtomic.shaderName = renderData.shaderName);
            renderData.indexBuffer && (renderAtomic.indexBuffer = renderData.indexBuffer);

            for (var attributeName in renderData.attributes) {
                renderAtomic.attributes[attributeName] = renderData.attributes[attributeName];
            }
            for (var uniformName in renderData.uniforms) {
                renderAtomic.uniforms[uniformName] = renderData.uniforms[uniformName];
            }
            for (var shaderParamName in renderData.shaderParams) {
                renderAtomic.shaderParams[shaderParamName] = renderData.shaderParams[shaderParamName];
            }
        }

        /**
         * 释放渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        public static deactivate(renderAtomic: RenderAtomic, renderData: RenderData) {

            renderData.shaderName && (renderAtomic.shaderName = null);
            renderData.indexBuffer && (renderAtomic.indexBuffer = null);

            for (var attributeName in renderData.attributes) {
                delete renderAtomic.attributes[attributeName];
            }
            for (var uniformName in renderData.uniforms) {
                delete renderAtomic.uniforms[uniformName];
            }
            for (var shaderParamName in renderData.shaderParams) {
                delete renderAtomic.shaderParams[shaderParamName];
            }
        }
    }
}