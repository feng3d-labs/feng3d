import { Component3D } from '../../3d/Component3D';
import { Node3D } from '../../3d/Node3D';
import { Scene3D } from '../../3d/Scene3D';
import { RegisterComponent } from '../../ecs/Component';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { Camera3D } from '../cameras/Camera3D';
import { forwardRenderer } from '../../3d/renderer/ForwardRenderer3D';
import { outlineRenderer } from '../../3d/outline/Outline3DRenderer';
import { shadowRenderer } from '../../3d/renderer/ShadowRenderer';
import { wireframeRenderer } from '../../3d/wireframe/Wireframe3DRenderer';
import { skyboxRenderer } from '../../3d/skybox/SkyBox3DRenderer';
import { ticker } from '../utils/Ticker';
import { RenderContext } from './RenderContext';

declare module '../../3d/Node3D'
{
    interface Node3DEventMap
    {
        /**
         * 渲染前事件，将在每次渲染前进行派发。
         *
         * 组件可以监听该事件，在渲染前更新渲染所需数据等。
         */
        beforeRender: RenderContext;

        /**
         * 渲染后事件，将在每次渲染结束后进行派发。
         */
        afterRender: RenderContext;
    }
}

declare module '../../ecs/Component'
{
    interface ComponentMap { View3D: View3D; }
}

/**
 * 视图
 */
@RegisterComponent({ name: 'View3D' })
export class View3D extends Component3D
{
    /**
     * 将被绘制的目标画布。
     */
    get canvas()
    {
        if (!this._canvas)
        {
            const canvas = document.createElement('canvas');
            canvas.id = 'glcanvas';
            canvas.style.position = 'fixed';
            canvas.style.left = '0px';
            canvas.style.top = '0px';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            document.body.appendChild(canvas);
            this.canvas = canvas;
        }

        return this._canvas;
    }
    set canvas(v)
    {
        if (this._canvas)
        {
            this._canvas.removeEventListener('webglcontextlost', this._onContextLost, false);
            this._canvas.removeEventListener('webglcontextrestored', this._onContextRestore, false);
            this._canvas.removeEventListener('webglcontextcreationerror', this._onContextCreationError, false);
        }
        this._canvas = v;
        if (this._canvas)
        {
            this._canvas.addEventListener('webglcontextlost', this._onContextLost, false);
            this._canvas.addEventListener('webglcontextrestored', this._onContextRestore, false);
            this._canvas.addEventListener('webglcontextcreationerror', this._onContextCreationError, false);
        }
    }
    private _canvas: HTMLCanvasElement;

    /**
     * 渲染时使用的摄像机。
     *
     * 如果值为undefined时，从自身与子结点中获取到 Camera 组件。默认为undefined。
     */
    camera: Camera3D;

    /**
     * 将要渲染的3D场景。
     *
     * 如果值为undefined时，从自身与子结点中获取到 Scene 组件。默认为undefined。
     */
    scene: Scene3D;

    /**
     * webgl初始化参数。
     *
     * 注：只在初始化时设置生效。
     */
    contextAttributes: WebGLContextAttributes = { stencil: true, antialias: true };

    /**
     * 是否自动调用 render() 渲染。
     *
     * 默认为true。
     */
    get isAutoRender()
    {
        return this._isAutoRender;
    }
    set isAutoRender(v)
    {
        if (this._isAutoRender)
        {
            ticker.offFrame(this.render, this);
        }
        this._isAutoRender = v;
        if (this._isAutoRender)
        {
            ticker.onFrame(this.render, this);
        }
    }
    private _isAutoRender: boolean;

    /**
     * 当前渲染时将使用的 Camera 。
     */
    private getRenderCamera()
    {
        let camera = this.camera;
        if (!camera)
        {
            camera = this.getComponentInChildren('Camera');
        }

        return camera;
    }

    /**
     * 当前渲染时将使用的 Scene 。
     */
    private getRenderScene()
    {
        let scene = this.scene;
        if (!scene)
        {
            scene = this.getComponentInChildren('Scene3D');
        }

        return scene;
    }

    /**
     * WebGL渲染上下文，圖形庫。
     */
    private get gl()
    {
        if (!this._gl)
        {
            const canvas = this.canvas;

            const contextAttributes = Object.assign({
                depth: true,
                stencil: true,
                antialias: false,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                powerPreference: 'default',
                failIfMajorPerformanceCaveat: false,
            } as Partial<WebGLContextAttributes>, this.contextAttributes);

            const contextNames = ['webgl2', 'webgl', 'experimental-webgl'];
            this._gl = getContext(canvas, contextNames, contextAttributes) as WebGLRenderingContext;
        }

        return this._gl;
    }
    private _gl: WebGLRenderingContext;

    /**
     * WebGL渲染器。
     */
    private get webGLRenderer()
    {
        if (!this._webGLRenderer)
        {
            this._webGLRenderer = new WebGLRenderer();
            this._webGLRenderer.gl = this.gl;
        }

        return this._webGLRenderer;
    }
    private _webGLRenderer: WebGLRenderer;

    init(): void
    {
        this.isAutoRender = true;
    }

    /**
     * 绘制场景
     */
    render(_interval?: number)
    {
        if (this._isContextLost === true) return;

        const camera = this.getRenderCamera();
        if (!camera)
        {
            console.warn(`无法从自身与子结点中获取到 Camera 组件，无法渲染！`);

            return;
        }
        const scene = this.getRenderScene();
        if (!scene)
        {
            console.warn(`无法从自身与子结点中获取到 Scene 组件，无法渲染！`);

            return;
        }

        const canvas = this.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (canvas.width * canvas.height === 0) return;

        const webGLRenderer = this.webGLRenderer;

        const data = new RenderContext(canvas, camera, scene, webGLRenderer);

        //
        this.emitter.emit('beforeRender', data, true, true);

        const gl = this.gl;
        // 默认渲染
        gl.colorMask(true, true, true, true);
        gl.clearColor(scene.background.r, scene.background.g, scene.background.b, scene.background.a);
        gl.clearStencil(0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // 绘制阴影图
        shadowRenderer.draw(webGLRenderer, scene, camera);
        skyboxRenderer.draw(webGLRenderer, scene, camera);
        // 默认渲染
        forwardRenderer.draw(webGLRenderer, scene, camera);
        outlineRenderer.draw(webGLRenderer, scene, camera);
        wireframeRenderer.draw(webGLRenderer, scene, camera);

        // 派发渲染后事件
        this.emitter.emit('afterRender', data, true, true);
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

        this.webGLRenderer.init();
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
