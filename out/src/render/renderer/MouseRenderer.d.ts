declare namespace feng3d {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    class MouseRenderer extends RenderDataHolder {
        private _shaderName;
        selectedObject3D: GameObject;
        private objects;
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
        protected drawRenderables(renderContext: RenderContext, meshRenderer: MeshRenderer): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
    }
}
