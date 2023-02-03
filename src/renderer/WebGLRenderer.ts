/* eslint-disable no-new */
import { RenderAtomic } from './data/RenderAtomic';
import { WebGLAttributeBuffers } from './gl/WebGLAttributeBuffers';
import { WebGLBindingStates } from './gl/WebGLBindingStates';
import { WebGLRenderbuffers } from './gl/WebGLRenderbuffers';
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
import { WebGLContext } from './WebGLContext';

/**
 * WEBGL 渲染器
 *
 * 所有渲染都由该渲染器执行。與2D、3D場景無關，屬於更加底層的API。針對每一個 RenderAtomic 渲染數據進行渲染。
 *
 * 3D 渲染請使用 WebGLRenderer3D。
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

    readonly gl2: WebGL2RenderingContext;

    /**
     * WebGL扩展
     */
    readonly extensions: WebGLExtensions;

    readonly webGLContext: WebGLContext;

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
        this.gl = getContext(canvas, contextNames, contextAttributes) as WebGLRenderingContext;
        this.gl2 = this.gl as any;

        this.webGLContext = new WebGLContext(this);
        this.extensions = new WebGLExtensions(this);

        this.capabilities = new WebGLCapabilities(this);
        this.extensions.init(this.capabilities);
        this.info = new WebGLInfo(this);
        this.shaders = new WebGLShaders(this);
        this.textures = new WebGLTextures(this);
        this.state = new WebGLState(this);
        this.attributeBuffers = new WebGLAttributeBuffers(this);
        this.elementBuffers = new WebGLElementBuffers(this);

        this.bindingStates = new WebGLBindingStates(this);
        this.renderParams = new WebGLRenderParams(this);
        this.uniforms = new WebGLUniforms();
        this.renderbuffers = new WebGLRenderbuffers(this);
        this.framebuffers = new WebGLFramebuffers(this);
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

            uniforms.activeUniforms(this, renderAtomic, shaderResult.uniforms);

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
