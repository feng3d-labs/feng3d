import { Lazy, lazy, LazyObject } from '../../polyfill/Types';
import { WebGLAttributeBuffers } from '../gl/WebGLAttributeBuffers';
import { ShaderMacro } from '../shader/Macro';
import { AttributeBuffer } from './AttributeBuffer';
import { ElementBuffer } from './ElementBuffer';
import { RenderParams } from './RenderParams';
import { Shader } from './Shader';
import { Uniforms } from './Uniforms';

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
    index: ElementBuffer;

    /**
     * 属性数据列表
     */
    attributes: { [key: string]: AttributeBuffer; } = {};

    /**
     * Uniform渲染数据
     */
    uniforms: LazyObject<Uniforms> = {} as any;

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
    shaderMacro: ShaderMacro = {} as any;

    /**
     * 渲染参数
     */
    renderParams = new RenderParams();

    getIndexBuffer(): ElementBuffer
    {
        if (this.index !== undefined) return this.index;

        return (this.next && this.next.getIndexBuffer());
    }

    getAttributes(attributes: { [key: string]: AttributeBuffer; } = {})
    {
        this.next && this.next.getAttributes(attributes);
        Object.assign(attributes, this.attributes);

        return attributes;
    }

    getAttributeByKey(key: string): AttributeBuffer
    {
        if (this.attributes[key] !== undefined) return this.attributes[key];

        return (this.next && this.next.getAttributeByKey(key));
    }

    getUniforms(uniforms: LazyObject<Uniforms> = {} as any)
    {
        this.next && this.next.getUniforms(uniforms);
        Object.assign(uniforms, this.uniforms);

        return uniforms;
    }

    getUniformByKey(key: string): any
    {
        if (this.uniforms[key] !== undefined) return lazy.getValue(this.uniforms[key]);

        return (this.next && this.next.getUniformByKey(key));
    }

    getInstanceCount(): number
    {
        if (this.instanceCount !== undefined) return lazy.getValue(this.instanceCount);

        return this.next && this.next.getInstanceCount();
    }

    getShader(): Shader
    {
        if (this.shader !== undefined) return this.shader;

        return this.next && this.next.getShader();
    }

    getRenderParams(renderParams = new RenderParams())
    {
        this.next && this.next.getRenderParams(renderParams);
        Object.assign(renderParams, this.renderParams);

        return renderParams;
    }

    getShaderMacro(shaderMacro: ShaderMacro = {} as any)
    {
        this.next && this.next.getShaderMacro(shaderMacro);
        Object.assign(shaderMacro, this.shaderMacro);

        return shaderMacro;
    }

    /**
     * 获取属性顶点属性。
     *
     * @param attributes
     * @returns
     */
    getAttributeVertexNum(attributes: WebGLAttributeBuffers)
    {
        const vertexNum = ((attributelist) =>
        {
            for (const attr in attributelist)
            {
                // eslint-disable-next-line no-prototype-builtins
                if (attributelist.hasOwnProperty(attr))
                {
                    const attribute = attributes.get(attributelist[attr]);

                    return attribute.count;
                }
            }

            return 0;
        })(this.getAttributes());

        return vertexNum;
    }
}
