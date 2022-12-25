import { Ray3 } from '../../math/geom/Ray3';
import { Rectangle } from '../../math/geom/Rectangle';
import { Vector2 } from '../../math/geom/Vector2';
import { Vector3 } from '../../math/geom/Vector3';
import { WebGLRenderer, WebGLRendererParameters } from '../../renderer/WebGLRenderer';
import { $set, serialization } from '../../serialization/Serialization';
import { windowEventProxy } from '../../shortcut/WindowEventProxy';
import { AudioListener } from '../audio/AudioListener';
import { Camera } from '../cameras/Camera';
import { DirectionalLight } from '../light/DirectionalLight';
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { Scene } from '../scene/Scene';
import { skyboxRenderer } from '../skybox/SkyBoxRenderer';
import { ticker } from '../utils/Ticker';
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
export class View
{
    //
    canvas: HTMLCanvasElement;

    private _contextAttributes: WebGLContextAttributes = { stencil: true, antialias: true };

    /**
     * 摄像机
     */
    get camera()
    {
        if (!this._camera)
        {
            const cameras = this.scene.getComponentsInChildren(Camera);
            if (cameras.length === 0)
            {
                this._camera = $set(new Node3D(), { name: 'defaultCamera' }).addComponent(Camera);
                this.scene.node3d.addChild(this._camera.node3d);
            }
            else
            {
                this._camera = cameras[0];
            }
        }

        return this._camera;
    }
    set camera(v)
    {
        this._camera = v;
    }
    private _camera: Camera;
    /**
     * 3d场景
     */
    scene: Scene;
    /**
     * 根结点
     */
    get root()
    {
        return this.scene.node3d;
    }

    get gl()
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

    protected contextLost = false;

    /**
     * 构建3D视图
     * @param canvas    画布
     * @param scene     3D场景
     * @param camera    摄像机
     */
    constructor(canvas?: HTMLCanvasElement, scene?: Scene, camera?: Camera, contextAttributes?: WebGLContextAttributes)
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
        console.assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);

        this.canvas = canvas;
        if (contextAttributes)
        {
            Object.assign(this._contextAttributes, contextAttributes);
        }

        this.scene = scene || $set(new Node3D(), { name: 'scene' }).addComponent(Scene);
        this.camera = camera;

        this.start();

        this.mouse3DManager = new Mouse3DManager(new WindowMouseInput(), () => this.viewRect);
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
     * 绘制场景
     */
    render(interval?: number)
    {
        if (!this.scene) return;
        if (this.contextLost) return;

        this.scene.update(interval);

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        if (this.canvas.width * this.canvas.height === 0) return;

        const clientRect = this.canvas.getBoundingClientRect();

        this.viewRect.x = clientRect.left;
        this.viewRect.y = clientRect.top;
        this.viewRect.width = clientRect.width;
        this.viewRect.height = clientRect.height;

        this.mousePos.x = windowEventProxy.clientX - clientRect.left;
        this.mousePos.y = windowEventProxy.clientY - clientRect.top;

        this.camera.lens.aspect = this.viewRect.width / this.viewRect.height;

        // 设置鼠标射线
        this.calcMouseRay3D();

        this.scene.mouseRay3D = this.mouseRay3D;
        this.scene.camera = this.camera;

        const gl = this.gl.gl;

        // 默认渲染
        gl.colorMask(true, true, true, true);
        gl.clearColor(this.scene.background.r, this.scene.background.g, this.scene.background.b, this.scene.background.a);
        gl.clearStencil(0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // 鼠标拾取渲染
        this.selectedObject = this.mouse3DManager.pick(this, this.scene, this.camera);
        // 绘制阴影图
        shadowRenderer.draw(this.gl, this.scene, this.camera);
        skyboxRenderer.draw(this.gl, this.scene, this.camera);
        // 默认渲染
        forwardRenderer.draw(this.gl, this.scene, this.camera);
        outlineRenderer.draw(this.gl, this.scene, this.camera);
        wireframeRenderer.draw(this.gl, this.scene, this.camera);
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
        this.mouseRay3D = this.camera.getRay3D(gpuPos.x, gpuPos.y);
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

    static createNewScene()
    {
        const scene = $set(new Node3D(), { name: 'Untitled' }).addComponent(Scene);
        scene.background.setTo(0.2784, 0.2784, 0.2784);
        scene.ambientColor.setTo(0.4, 0.4, 0.4);

        const camera = Node3D.createPrimitive('Camera', { name: 'Main Camera' });
        camera.addComponent(AudioListener);
        camera.position = new Vector3(0, 1, -10);
        scene.node3d.addChild(camera);

        const directionalLight = $set(new Node3D(), { name: 'DirectionalLight' });
        directionalLight.addComponent(DirectionalLight).shadowType = ShadowType.Hard_Shadows;
        directionalLight.rx = 50;
        directionalLight.ry = -30;
        directionalLight.y = 3;
        scene.node3d.addChild(directionalLight);

        return scene;
    }
}

// var viewRect0 = { x: 0, y: 0, w: 400, h: 300 };
