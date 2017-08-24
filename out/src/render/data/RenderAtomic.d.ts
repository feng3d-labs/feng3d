declare namespace feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        addRenderElement(element: RenderElement | RenderElement[]): void;
        removeRenderElement(element: RenderElement | RenderElement[]): void;
        private onElementChange(event);
        addUniform(uniformData: UniformData): void;
        removeUniform(uniformData: UniformData): void;
        addAttribute(attributeData: AttributeRenderData): void;
        removeAttribute(attributeData: AttributeRenderData): void;
        /**
         * 顶点索引缓冲
         */
        private indexBuffer;
        /**
         * 渲染程序
         */
        shader: ShaderRenderData;
        /**
         * 属性数据列表
         */
        private attributes;
        /**
         * Uniform渲染数据
         */
        private uniforms;
        /**
         * 渲染实例数量
         */
        private instanceCount;
        constructor();
        invalidateShader(): void;
        /**
         * 激活属性
         */
        activeAttributes(gl: GL, attributeInfos: WebGLActiveInfo[]): void;
        /**
         * 激活常量
         */
        activeUniforms(gl: GL, uniformInfos: WebGLActiveInfo[]): void;
        /**
         * 设置环境Uniform数据
         */
        private setContext3DUniform(gl, activeInfo, data);
        /**
         */
        dodraw(gl: GL): void;
    }
}
