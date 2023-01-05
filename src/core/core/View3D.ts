import { Ray3 } from '../../math/geom/Ray3';
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
import { Mouse3DManager, WindowMouseInput } from './Mouse3DManager';
import { Node3D } from './Node3D';
import { Renderer } from './Renderer';

declare global
{
    interface HTMLCanvasElement
    {
        gl: WebGLRenderer;
    }
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
     * 鼠标事件管理
     */
    mouse3DManager: Mouse3DManager;

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

        this.mouse3DManager = new Mouse3DManager(new WindowMouseInput(), () => this.viewRect);
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
        ticker.onFrame(this.update, this);
    }

    stop()
    {
        ticker.offFrame(this.update, this);
    }

    update(interval?: number)
    {
        this.render(interval);
        this.mouse3DManager.selectedObject3D = this.selectedObject;
    }

    /**
     * 获取渲染时将使用的摄像机。
     */
    private getRenderCamera()
    {
        let camera = this.camera;
        if (!camera)
        {
            camera = this.getComponentInChildren(Camera);
        }

        return camera;
    }

    /**
     * 获取将被渲染的3D场景。
     */
    private getRenderScene()
    {
        let scene = this.scene;
        if (!scene)
        {
            scene = this.getComponentInChildren(Scene);
        }

        return scene;
    }

    /**
     * 绘制场景
     */
    render(interval?: number)
    {
        const camera = this.getRenderCamera();
        if (!camera)
        {
            console.warn(`无法从自身与子结点中获取到 Camera 组件，无法渲染！`);

            return null;
        }
        const scene = this.getRenderScene();
        if (!scene)
        {
            console.warn(`无法从自身与子结点中获取到 Scene 组件，无法渲染！`);

            return null;
        }

        // scene.update(interval);

        const { canvas, viewRect, mousePos, mouseRay3D, webGLRenderer, mouse3DManager } = this;
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

        // 设置鼠标射线
        this.calcMouseRay3D();

        scene.mouseRay3D = mouseRay3D;

        // 默认渲染
        gl.colorMask(true, true, true, true);
        gl.clearColor(scene.background.r, scene.background.g, scene.background.b, scene.background.a);
        gl.clearStencil(0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // 鼠标拾取渲染
        this.selectedObject = mouse3DManager.pick(this, scene, camera);
        // 绘制阴影图
        shadowRenderer.draw(webGLRenderer, scene, camera);
        skyboxRenderer.draw(webGLRenderer, scene, camera);
        // 默认渲染
        forwardRenderer.draw(webGLRenderer, scene, camera);
        outlineRenderer.draw(webGLRenderer, scene, camera);
        wireframeRenderer.draw(webGLRenderer, scene, camera);
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
    mouseRay3D: Ray3;

    private calcMouseRay3D()
    {
        const gpuPos = this.screenToGpuPosition(this.mousePos);
        const camera = this.getRenderCamera();

        this.mouseRay3D = camera.getRay3D(gpuPos.x, gpuPos.y);
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

    protected selectedObject: Node3D;
}

// var viewRect0 = { x: 0, y: 0, w: 400, h: 300 };
