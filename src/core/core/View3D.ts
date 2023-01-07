import { Rectangle } from '../../math/geom/Rectangle';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { WebGLRenderer, WebGLRendererParameters } from '../../renderer/WebGLRenderer';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { Camera } from '../cameras/Camera';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { Scene } from '../scene/Scene';
import { skyboxRenderer } from '../skybox/SkyBoxRenderer';
import { ticker } from '../utils/Ticker';
import { Component3D } from './Component3D';
import { Node3D } from './Node3D';
import { Renderer } from './Renderer';

declare global
{
    interface HTMLCanvasElement
    {
        gl: WebGLRenderer;
    }

    export interface MixinsNode3DEventMap
    {
        /**
         * 渲染前事件，将在每次渲染前进行派发。
         *
         * 组件可以监听该事件，在渲染前更新渲染所需数据等。
         */
        beforeRender: BeforeRenderEventData;

        /**
         * 渲染后事件，将在每次渲染结束后进行派发。
         */
        afterRender: AfterRenderEventData;
    }
}

/**
 * 渲染后事件数据
 */
export interface AfterRenderEventData extends BeforeRenderEventData { }

/**
 * 渲染前事件数据
 */
export interface BeforeRenderEventData
{
    /**
     *
     */
    view: View3D;

    /**
     * 渲染时将使用的摄像机。
     */
    camera: Camera;

    /**
     * 将被渲染的3D场景。
     */
    scene: Scene;
}

/**
 * 视图
 */
export class View3D extends Component3D
{
    /**
     * 将被绘制的目标画布。
     */
    canvas: HTMLCanvasElement;

    private _contextAttributes: WebGLContextAttributes = { stencil: true, antialias: true };

    /**
     * 渲染时使用的摄像机。
     *
     * 如果值为undefined时，从自身与子结点中获取到 Camera 组件。默认为undefined。
     */
    camera: Camera;

    /**
     * 将要渲染的3D场景。
     *
     * 如果值为undefined时，从自身与子结点中获取到 Scene 组件。默认为undefined。
     */
    scene: Scene;

    /**
     * 根结点
     */
    get root()
    {
        return this.scene.node3d;
    }

    get webGLRenderer()
    {
        if (!this.canvas.gl)
        {
            const parameters: Partial<WebGLRendererParameters> = Object.assign({ canvas: this.canvas }, this._contextAttributes);
            this.canvas.gl = new WebGLRenderer(parameters);
        }

        return this.canvas.gl;
    }

    /**
     * 鼠标在3D视图中的位置
     */
    mousePos = new Vector2();

    viewRect = new Rectangle();

    /**
     * 构建3D视图
     * @param canvas    画布
     * @param scene     3D场景
     * @param camera    摄像机
     */
    constructor(canvas?: HTMLCanvasElement, scene?: Scene, camera?: Camera, contextAttributes?: WebGLContextAttributes)
    {
        super();
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
        console.assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);

        this.canvas = canvas;
        if (contextAttributes)
        {
            Object.assign(this._contextAttributes, contextAttributes);
        }

        this.scene = scene;
        this.camera = camera;

        this.start();
    }

    init(): void
    {

    }

    /**
     * 修改canvas尺寸
     * @param width 宽度
     * @param height 高度
     */
    setSize(width: number, height: number)
    {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    start()
    {
        ticker.onFrame(this.render, this);
    }

    stop()
    {
        ticker.offFrame(this.render, this);
    }

    /**
     * 绘制场景
     */
    render(interval?: number)
    {
        let camera = this.camera;
        if (!camera)
        {
            camera = this.getComponentInChildren(Camera);
            if (!camera)
            {
                console.warn(`无法从自身与子结点中获取到 Camera 组件，无法渲染！`);

                return;
            }
        }
        let scene = this.scene;
        if (!scene)
        {
            scene = this.getComponentInChildren(Scene);
            if (!scene)
            {
                console.warn(`无法从自身与子结点中获取到 Scene 组件，无法渲染！`);

                return;
            }
        }

        //
        this.emitter.emit('beforeRender', { view: this, camera, scene }, true, true);

        const { canvas, viewRect, mousePos, webGLRenderer } = this;
        const gl = this.webGLRenderer.gl;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (canvas.width * canvas.height === 0) return;

        const clientRect = canvas.getBoundingClientRect();

        viewRect.x = clientRect.left;
        viewRect.y = clientRect.top;
        viewRect.width = clientRect.width;
        viewRect.height = clientRect.height;

        mousePos.x = windowEventProxy.clientX - clientRect.left;
        mousePos.y = windowEventProxy.clientY - clientRect.top;

        camera.lens.aspect = viewRect.width / viewRect.height;

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
        this.emitter.emit('afterRender', { view: this, camera, scene }, true, true);
    }

    /**
     * 屏幕坐标转GPU坐标
     * @param screenPos 屏幕坐标 (x: [0-width], y: [0 - height])
     * @return GPU坐标 (x: [-1, 1], y: [-1, 1])
     */
    screenToGpuPosition(screenPos: Vector2): Vector2
    {
        const gpuPos: Vector2 = new Vector2();
        gpuPos.x = (screenPos.x * 2 - this.viewRect.width) / this.viewRect.width;
        // 屏幕坐标与gpu中使用的坐标Y轴方向相反
        gpuPos.y = -(screenPos.y * 2 - this.viewRect.height) / this.viewRect.height;

        return gpuPos;
    }

    /**
     * 投影坐标（世界坐标转换为3D视图坐标）
     * @param point3d 世界坐标
     * @return 屏幕的绝对坐标
     */
    project(point3d: Vector3): Vector3
    {
        const v: Vector3 = this.camera.project(point3d);
        v.x = (v.x + 1.0) * this.viewRect.width / 2.0;
        v.y = (1.0 - v.y) * this.viewRect.height / 2.0;

        return v;
    }

    /**
     * 屏幕坐标投影到场景坐标
     * @param nX 屏幕坐标X ([0-width])
     * @param nY 屏幕坐标Y ([0-height])
     * @param sZ 到屏幕的距离
     * @param v 场景坐标（输出）
     * @return 场景坐标
     */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        const gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(sX, sY));

        return this.camera.unproject(gpuPos.x, gpuPos.y, sZ, v);
    }

    /**
     * 获取单位像素在指定深度映射的大小
     * @param   depth   深度
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        let scale = this.camera.getScaleByDepth(depth, dir);
        scale = scale / new Vector2(this.viewRect.width * dir.x, this.viewRect.height * dir.y).length;

        return scale;
    }

    /**
     * 获取鼠标射线（与鼠标重叠的摄像机射线）
     */
    getMouseRay3D(camera: Camera)
    {
        const gpuPos = this.screenToGpuPosition(this.mousePos);

        const ray = camera.getRay3D(gpuPos.x, gpuPos.y);

        return ray;
    }

    /**
     * 获取屏幕区域内所有游戏对象
     * @param start 起点
     * @param end 终点
     */
    getObjectsInGlobalArea(start: Vector2, end: Vector2)
    {
        const s = this.viewRect.clampPoint(start);
        const e = this.viewRect.clampPoint(end);
        s.sub(this.viewRect.topLeft);
        e.sub(this.viewRect.topLeft);
        const min = s.clone().min(e);
        const max = s.clone().max(e);
        const rect = new Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
        //
        let node3ds = this.scene.node3d.traverse((node3d: Node3D) =>
        {
            if (node3d === this.scene.entity) return;

            return node3d;
        });

        node3ds = node3ds.filter((node3d) =>
        {
            if (!node3d) return false;

            const m = node3d.getComponent(Renderer);
            if (m)
            {
                const include = m.selfWorldBounds.toPoints().every((pos) =>
                {
                    const p = this.project(pos);

                    return rect.contains(p.x, p.y);
                });

                return include;
            }
            const p = this.project(node3d.worldPosition);

            return rect.contains(p.x, p.y);
        });

        return node3ds;
    }
}

// var viewRect0 = { x: 0, y: 0, w: 400, h: 300 };
