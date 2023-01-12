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
    /**
     * 将被绘制的目标画布。
     */
    readonly canvas: HTMLCanvasElement;

    /**
     * WebGL渲染上下文，圖形庫。
     */
    readonly gl: WebGLRenderingContext;

    /**
     * WebGL扩展
     */
    readonly extensions: WebGLExtensions;

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

    constructor(canvas?: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes)
    {
        if (!canvas)
        {
            canvas = document.createElement('canvas');
            canvas.id = 'glcanvas';
            canvas.style.position = 'fixed';
            canvas.style.left = '0px';
            canvas.style.top = '0px';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            document.body.appendChild(canvas);
        }
        canvas.addEventListener('webglcontextlost', this._onContextLost, false);
        canvas.addEventListener('webglcontextrestored', this._onContextRestore, false);
        canvas.addEventListener('webglcontextcreationerror', this._onContextCreationError, false);
        this.canvas = canvas;

        contextAttributes = Object.assign({
            depth: true,
            stencil: true,
            antialias: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
        } as Partial<WebGLContextAttributes>, contextAttributes);

        const contextNames = ['webgl2', 'webgl', 'experimental-webgl'];
        const gl = this.gl = getContext(canvas, contextNames, contextAttributes) as WebGLRenderingContext;

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

    /**
     * 渲染一次。
     *
     * @param renderAtomic 渲染原子，包含渲染所需的所有数据。
     * @param offset ToDO 合并到RenderAtomic中
     * @param count ToDO 合并到RenderAtomic中
     */
    render(renderAtomic: RenderAtomic, offset?: number, count?: number)
    {
        if (this._isContextLost === true) return;

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

    private _isContextLost = false;
    private _onContextLost = (event: Event) =>
    {
        event.preventDefault();

        console.warn('WebGLRenderer: Context Lost.');

        this._isContextLost = true;
    };

    private _onContextRestore = () =>
    {
        console.warn('WebGLRenderer: Context Restored.');

        this._isContextLost = false;
    };

    private _onContextCreationError = (event: WebGLContextEvent) =>
    {
        console.error('WebGLRenderer: A WebGL context could not be created. Reason: ', event.statusMessage);
    };
}

function getContext(canvas: HTMLCanvasElement, contextNames: string[], contextAttributes?: Partial<WebGLContextAttributes>)
{
    const context = _getContext(canvas, contextNames, contextAttributes);

    if (!context)
    {
        if (_getContext(canvas, contextNames))
        {
            throw new Error('Error creating WebGL context with your selected attributes.');
        }
        else
        {
            throw new Error('Error creating WebGL context.');
        }
    }

    return context;
}

function _getContext(canvas: HTMLCanvasElement, contextNames: string[], contextAttributes?: Partial<WebGLContextAttributes>)
{
    let context: RenderingContext;
    for (let i = 0; i < contextNames.length; ++i)
    {
        context = canvas.getContext(contextNames[i], contextAttributes);
        if (context) return context;
    }

    return null;
}
