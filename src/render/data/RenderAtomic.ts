namespace feng3d
{
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    export class RenderAtomic
    {
        /**
         * 下一个结点
         */
        next: RenderAtomic;

        /**
         * 顶点索引缓冲
         */
        indexBuffer: Index;

        /**
         * 属性数据列表
         */
        attributes: Attributes = <any>{};

        /**
         * Uniform渲染数据
         */
        uniforms: LazyUniforms = <any>{};

        /**
         * 渲染实例数量
         */
        instanceCount: Lazy<number>;

        /**
         * 渲染程序
         */
        shader: Shader;

        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro = <any>{};

        /**
         * 渲染参数
         */
        renderParams = new RenderParams();

        getIndexBuffer(): Index
        {
            if (this.indexBuffer != undefined) return this.indexBuffer;
            return (this.next && this.next.getIndexBuffer());
        }

        getAttributeByKey(key: string): Attribute
        {
            if (this.attributes[key] != undefined) return this.attributes[key];
            return (this.next && this.next.getAttributeByKey(key));
        }

        getUniformByKey(key: string): Uniforms
        {
            if (this.uniforms[key] != undefined) return lazy.getvalue(this.uniforms[key]);
            return (this.next && this.next.getUniformByKey(key));
        }

        getInstanceCount()
        {
            if (this.instanceCount != undefined) return lazy.getvalue(this.instanceCount);
            return this.next && this.next.getInstanceCount();
        }

        getShader()
        {
            if (this.shader != undefined) return this.shader;
            return this.next && this.shader;
        }

        getRenderParams(renderParams: RenderParams = <any>{})
        {
            this.next && this.next.getRenderParams(renderParams);
            Object.assign(renderParams, this.renderParams);
            return renderParams;
        }

        getShaderMacro(shaderMacro: ShaderMacro = <any>{})
        {
            this.next && this.next.getShaderMacro(shaderMacro);
            Object.assign(shaderMacro, this.shaderMacro);
            return shaderMacro;
        }
    }
}