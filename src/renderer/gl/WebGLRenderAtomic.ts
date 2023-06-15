import { LazyObject } from '@feng3d/polyfill';
import { WebGLRenderer } from '../WebGLRenderer';
import { AttributeBuffer } from '../data/AttributeBuffer';
import { DrawCall } from '../data/DrawCall';
import { ElementBuffer } from '../data/ElementBuffer';
import { RenderAtomic } from '../data/RenderAtomic';
import { RenderParams } from '../data/RenderParams';
import { Shader } from '../data/Shader';
import { Uniforms } from '../data/Uniforms';
import { ShaderMacro } from '../shader/Macro';
import { WebGLAttributeBuffers } from './WebGLAttributeBuffers';

export class WebGLRenderAtomic
{
    private _webGLRenderer: WebGLRenderer;

    /**
     * 顶点索引缓冲
     */
    index: ElementBuffer;

    /**
     * 属性数据列表
     */
    attributes: { [key: string]: AttributeBuffer; };

    /**
     * Uniform渲染数据
     */
    uniforms: LazyObject<Uniforms>;

    drawCall = new DrawCall();

    /**
     * 渲染程序
     */
    shader: Shader;

    /**
     * shader 中的 宏
     */
    shaderMacro: ShaderMacro;

    /**
     * 渲染参数
     */
    renderParams: RenderParams;

    constructor(webGLRenderer: WebGLRenderer, renderAtomic: RenderAtomic)
    {
        this._webGLRenderer = webGLRenderer;

        this.index = this.getIndexBuffer(renderAtomic);
        this.attributes = this.getAttributes(renderAtomic);
        this.uniforms = this.getUniforms(renderAtomic);
        this.drawCall = this.getDrawCall(renderAtomic);
        this.shader = this.getShader(renderAtomic);
        this.shaderMacro = this.getShaderMacro(renderAtomic);
        this.renderParams = this.getRenderParams(renderAtomic);
    }

    private getIndexBuffer(renderAtomic: RenderAtomic): ElementBuffer
    {
        if (renderAtomic.index !== undefined) return renderAtomic.index;

        return (renderAtomic.next && this.getIndexBuffer(renderAtomic.next));
    }

    private getUniforms(renderAtomic: RenderAtomic, uniforms: LazyObject<Uniforms> = {} as any)
    {
        renderAtomic.next && this.getUniforms(renderAtomic.next, uniforms);
        Object.assign(uniforms, renderAtomic.uniforms);

        return uniforms;
    }

    private getDrawCall(renderAtomic: RenderAtomic, drawCall = new DrawCall())
    {
        renderAtomic.next && this.getDrawCall(renderAtomic.next, drawCall);
        Object.assign(drawCall, renderAtomic.drawCall);

        return drawCall;
    }

    private getShaderMacro(renderAtomic: RenderAtomic, shaderMacro: ShaderMacro = {} as any)
    {
        renderAtomic.next && this.getShaderMacro(renderAtomic.next, shaderMacro);
        Object.assign(shaderMacro, renderAtomic.shaderMacro);

        return shaderMacro;
    }

    private getShader(renderAtomic: RenderAtomic): Shader
    {
        if (renderAtomic.shader !== undefined) return renderAtomic.shader;

        return renderAtomic.next && this.getShader(renderAtomic.next);
    }

    private getRenderParams(renderAtomic: RenderAtomic, renderParams = new RenderParams())
    {
        renderAtomic.next && this.getRenderParams(renderAtomic.next, renderParams);
        Object.assign(renderParams, renderAtomic.renderParams);

        return renderParams;
    }

    private getAttributes(renderAtomic: RenderAtomic, attributes: { [key: string]: AttributeBuffer; } = {})
    {
        renderAtomic.next && this.getAttributes(renderAtomic.next, attributes);
        Object.assign(attributes, renderAtomic.attributes);

        return attributes;
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
        })(this.attributes);

        return vertexNum;
    }
}
