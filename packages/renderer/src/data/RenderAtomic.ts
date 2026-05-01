import { gPartial, Lazy, lazy } from '@feng3d/polyfill';
import { ShaderMacro } from '../shader/Macro';
import { Attribute } from './Attribute';
import { Attributes } from './Attributes';
import { Index } from './Index';
import { RenderParams } from './RenderParams';
import { Shader } from './Shader';
import { LazyUniforms, Uniforms } from './Uniform';

declare global
{
    interface MixinsRenderAtomic
    {

    }
}

export interface RenderAtomic extends MixinsRenderAtomic { }

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
    get index()
    {
        return this._index;
    }
    set index(v)
    {
        if (v instanceof Index)
        {
            this._index = v;
        }
        else
        {
            this._index = new Index(v);
        }
    }
    private _index: Index;

    /**
     * 属性数据列表
     */
    get attributes()
    {
        return this._attributes;
    }

    set attributes(v)
    {
        this._attributes = {} as any;
        for (const key in v)
        {
            if (v[key] instanceof Attribute)
            {
                this._attributes[key] = v[key];
            }
            else
            {
                this._attributes[key] = new Attribute(v[key]);
            }
        }
    }

    private _attributes: Attributes = {} as any;

    /**
     * Uniform渲染数据
     */
    uniforms: LazyUniforms = {} as any;

    /**
     * 渲染实例数量
     */
    instanceCount: Lazy<number>;

    /**
     * 渲染程序
     */
    get shader()
    {
        return this._shader;
    }
    set shader(v)
    {
        if (v instanceof Shader)
        {
            this._shader = v;
        }
        else
        {
            this._shader = new Shader(v);
        }
    }
    private _shader: Shader;

    /**
     * shader 中的 宏
     */
    shaderMacro: ShaderMacro = {} as any;

    /**
     * 渲染参数
     */
    get renderParams()
    {
        return this._renderParams;
    }
    set renderParams(v)
    {
        if (v instanceof RenderParams)
        {
            this._renderParams = v;
        }
        else
        {
            this._renderParams = new RenderParams(v);
        }
    }
    private _renderParams = new RenderParams();

    constructor(source?: gPartial<RenderAtomic>)
    {
        Object.assign(this, source);
    }

    getIndexBuffer(): Index
    {
        if (this.index !== undefined) return this.index;

        return (this.next && this.next.getIndexBuffer());
    }

    getAttributes(attributes: Attributes = {} as any)
    {
        this.next && this.next.getAttributes(attributes);
        Object.assign(attributes, this.attributes);

        return attributes;
    }

    getAttributeByKey(key: string): Attribute
    {
        if (this.attributes[key] !== undefined) return this.attributes[key];

        return (this.next && this.next.getAttributeByKey(key));
    }

    getUniforms(uniforms: LazyUniforms = {} as any)
    {
        this.next && this.next.getUniforms(uniforms);
        Object.assign(uniforms, this.uniforms);

        return uniforms;
    }

    getUniformByKey(key: string): Uniforms
    {
        if (this.uniforms[key] !== undefined) return lazy.getvalue(this.uniforms[key]);

        return (this.next && this.next.getUniformByKey(key));
    }

    getInstanceCount(): number
    {
        if (this.instanceCount !== undefined) return lazy.getvalue(this.instanceCount);

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
}

export interface RenderAtomicData
{
    shader: Shader;
    attributes: { [name: string]: Attribute; };
    uniforms: { [name: string]: Uniforms; };
    renderParams: RenderParams;
    index: Index;
    instanceCount: number;
}
