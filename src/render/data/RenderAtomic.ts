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

        getIndexBuffer()
        {
            var node: RenderAtomic = this;
            while (node)
            {
                if (node.indexBuffer != undefined)
                {
                    return node.indexBuffer;
                }
                node = node.next;
            }
            return undefined;
        }

        getAttributes(attributes: Attributes = <any>{})
        {
            var node: RenderAtomic = this;
            while (node)
            {
                for (const name in node.attributes)
                {
                    if (!attributes.hasOwnProperty(name))
                    {
                        attributes[name] = node.attributes[name];
                    }
                }
                node = node.next;
            }
            return attributes;
        }

        getAttributeByKey(key: string)
        {
            var node: RenderAtomic = this;
            while (node)
            {
                if (node.attributes[key] != undefined)
                    return node.attributes[key];
                node = node.next;
            }
            return undefined;
        }

        getUniforms(uniforms: LazyUniforms = <any>{})
        {
            var node: RenderAtomic = this;
            while (node)
            {
                for (const name in node.uniforms)
                {
                    if (!uniforms.hasOwnProperty(name))
                    {
                        uniforms[name] = lazy.getvalue(node.uniforms[name]);
                    }
                }
                node = node.next;
            }
            return uniforms;
        }

        getUniformByKey(key: string)
        {
            var node: RenderAtomic = this;
            while (node)
            {
                if (node.uniforms[key] != undefined)
                    return lazy.getvalue(node.uniforms[key]);
                node = node.next;
            }
            return undefined;
        }

        getInstanceCount()
        {
            var node: RenderAtomic = this;
            while (node)
            {
                if (node.instanceCount != undefined)
                {
                    return lazy.getvalue(node.instanceCount);
                }
                node = node.next;
            }
            return undefined;
        }

        getShader()
        {
            var node: RenderAtomic = this;
            while (node)
            {
                if (node.shader != undefined)
                {
                    return node.shader;
                }
                node = node.next;
            }
            return undefined;
        }

        getRenderParams(renderParams: RenderParams = <any>{})
        {
            var node: RenderAtomic = this;
            while (node)
            {
                for (const name in node.renderParams)
                {
                    if (!renderParams.hasOwnProperty(name))
                    {
                        renderParams[name] = node.renderParams[name];
                    }
                }
                node = node.next;
            }
            return renderParams;
        }

        getShaderMacro(shaderMacro: ShaderMacro = <any>{})
        {
            var node: RenderAtomic = this;
            while (node)
            {
                for (const name in node.shaderMacro)
                {
                    if (!shaderMacro.hasOwnProperty(name))
                    {
                        shaderMacro[name] = node.shaderMacro[name];
                    }
                }
                node = node.next;
            }
            return shaderMacro;
        }
    }
}