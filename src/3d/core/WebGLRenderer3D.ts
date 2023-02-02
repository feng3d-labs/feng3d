import { Camera3D } from '../cameras/Camera3D';
import { outlineRenderer } from '../outline/Outline3DRenderer';
import { forwardRenderer } from '../renderer/ForwardRenderer3D';
import { shadowRenderer } from '../renderer/ShadowRenderer';
import { skyboxRenderer } from '../skybox/SkyBox3DRenderer';
import { wireframeRenderer } from '../wireframe/Wireframe3DRenderer';
import { RegisterComponent } from '../../ecs/Component';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { ticker } from '../../utils/Ticker';
import { Component3D } from './Component3D';
import { Node3D } from './Node3D';
import { RenderContext3D } from './RenderContext3D';
import { Scene3D } from './Scene3D';

declare module './Node3D'
{
    interface Node3DEventMap
    {
        /**
         * 渲染前事件，将在每次渲染前进行派发。
         *
         * 组件可以监听该事件，在渲染前更新渲染所需数据等。
         */
        beforeRender: RenderContext3D;

        /**
         * 渲染后事件，将在每次渲染结束后进行派发。
         */
        afterRender: RenderContext3D;
    }
}

declare module '../../ecs/Component' { interface ComponentMap { WebGLRenderer3D: WebGLRenderer3D; } }

/**
 * 3D渲染器。
 *
 * 給定3D場景與攝像機，進行渲染。
 */
@RegisterComponent({ name: 'WebGLRenderer3D' })
export class WebGLRenderer3D extends Component3D
{
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
     * 初始化传入画布
     *
     * 注：只在初始化时设置生效。
     */
    canvas: HTMLCanvasElement;

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

    getRenderCanvas()
    {
        return this._webGLRenderer.canvas;
    }

    /**
     * 当前渲染时将使用的 Camera 。
     */
    private getRenderCamera()
    {
        let camera = this.camera;
        if (!camera)
        {
            camera = this.getComponentInChildren('Camera3D');
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
     * WebGL渲染器。
     */
    private _webGLRenderer: WebGLRenderer;

    init(): void
    {
        this.isAutoRender = true;

        this._webGLRenderer = new WebGLRenderer(this.canvas, this.contextAttributes);
    }

    /**
     * 绘制场景
     */
    render(_interval?: number)
    {
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

        const canvas = this._webGLRenderer.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (canvas.width * canvas.height === 0) return;

        const webGLRenderer = this._webGLRenderer;

        const data = new RenderContext3D(camera, scene, webGLRenderer);

        //
        this.emitter.emit('beforeRender', data, true, true);

        const { webGLContext } = webGLRenderer;

        // 默认渲染
        webGLContext.colorMask(true, true, true, true);
        webGLContext.clearColor(scene.background.r, scene.background.g, scene.background.b, scene.background.a);
        webGLContext.clearStencil(0);
        webGLContext.clearDepth(1);
        webGLContext.clear(['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT']);
        webGLContext.enable('DEPTH_TEST');

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
}
