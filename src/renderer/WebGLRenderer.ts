/* eslint-disable no-new */
import { RenderAtomic } from './data/RenderAtomic';
import { WebGLAttributeBuffers } from './gl/WebGLAttributeBuffers';
import { WebGLBindingStates } from './gl/WebGLBindingStates';
import { WebGLRenderbuffers } from './gl/WebGLBuffers';
import { WebGLCacheStates } from './gl/WebGLCacheStates';
import { WebGLCapabilities } from './gl/WebGLCapabilities';
import { WebGLElementBuffers } from './gl/WebGLElementBuffers';
import { WebGLExtensions } from './gl/WebGLExtensions';
import { WebGLFramebuffers } from './gl/WebGLFramebuffers';
import { WebGLInfo } from './gl/WebGLInfo';
import { WebGLRenderParams } from './gl/WebGLRenderParams';
import { WebGLShaders } from './gl/WebGLShaders';
import { WebGLState } from './gl/WebGLState';
import { WebGLTextures } from './gl/WebGLTextures';
import { WebGLUniforms } from './gl/WebGLUniforms';

/**
 * WEBGL 渲染器
 *
 * 所有渲染都由该渲染器执行
 */
export class WebGLRenderer
{
    get gl()
    {
        return this._gl;
    }
    set gl(v)
    {
        this.dipose();
        this._gl = v;
        this.init();
    }
    private _gl: WebGLRenderingContext;

    /**
     * WebGL扩展
     */
    extensions: WebGLExtensions;

    /**
     * WEBGL支持功能
     */
    capabilities: WebGLCapabilities;

    /**
     * WebGL纹理
     */
    textures: WebGLTextures;

    /**
     * WebGL信息
     */
    info: WebGLInfo;

    /**
     * 缓存WebGL状态
     */
    cacheStates: WebGLCacheStates;
    shaders: WebGLShaders;
    state: WebGLState;
    bindingStates: WebGLBindingStates;
    attributeBuffers: WebGLAttributeBuffers;
    renderParams: WebGLRenderParams;
    uniforms: WebGLUniforms;
    renderbuffers: WebGLRenderbuffers;
    framebuffers: WebGLFramebuffers;

    elementBuffers: WebGLElementBuffers;

    render(renderAtomic: RenderAtomic, offset?: number, count?: number)
    {
        const { bindingStates, renderParams, elementBuffers: elementBufferRenderer, uniforms, shaders } = this;

        try
        {
            const shaderResult = shaders.activeShader(renderAtomic);

            renderParams.updateRenderParams(renderAtomic.getRenderParams());

            bindingStates.setup(renderAtomic);

            uniforms.activeUniforms(renderAtomic, shaderResult.uniforms);

            elementBufferRenderer.render(renderAtomic, offset, count);
        }
        catch (error)
        {
            console.warn(error);
        }
    }

    dipose()
    {
    }

    init()
    {
        const gl = this.gl;

        this.extensions = new WebGLExtensions(gl);

        this.capabilities = new WebGLCapabilities(gl, this.extensions);
        this.extensions.init(this.capabilities);
        this.info = new WebGLInfo(gl);
        this.cacheStates = new WebGLCacheStates(gl);
        this.shaders = new WebGLShaders(gl);
        this.textures = new WebGLTextures(gl, this.extensions, this.capabilities);
        this.state = new WebGLState(gl, this.extensions, this.capabilities);
        this.attributeBuffers = new WebGLAttributeBuffers(gl, this.capabilities);
        this.elementBuffers = new WebGLElementBuffers(this);

        this.bindingStates = new WebGLBindingStates(gl, this.extensions, this.attributeBuffers, this.elementBuffers, this.capabilities, this.shaders);
        this.renderParams = new WebGLRenderParams(gl, this.capabilities, this.state);
        this.uniforms = new WebGLUniforms(gl, this.textures);
        this.renderbuffers = new WebGLRenderbuffers(gl);
        this.framebuffers = new WebGLFramebuffers(gl);
    }
}
