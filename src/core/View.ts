import { Ray3, Rectangle, Vector2, Vector3 } from '@feng3d/math';
import { batchRun, reactive, UnReadonly } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { windowEventProxy } from '@feng3d/shortcut';
import { RenderPass, RenderPassColorAttachment, RenderPassObject, Submit, WebGPU } from '@feng3d/webgpu';
import { AudioListener } from '../audio/AudioListener';
import { Camera, cameraLogic } from '../cameras/Camera';
import { DirectionalLight } from '../light/DirectionalLight';
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { Scene, sceneLogic } from '../scene/Scene';
import { skyboxRenderer } from '../skybox/SkyBoxRenderer';
import { ticker } from '../utils/Ticker';
import { Feng3dObject } from './Feng3dObject';
import { Object3D } from './Object3D';
import { createPrimitive, object3DLogic } from './object3DLogic';
import { Mouse3DManager, WindowMouseInput } from './Mouse3DManager';
import { Renderable, renderableLogic } from './Renderable';
import { transformLogic } from './transformLogic';
import { getComponentsInChildren } from '../component/componentQuery';

/**
 * 视图
 */
export class View extends Feng3dObject
{
    //
    canvas: HTMLCanvasElement;

    private _contextAttributes: WebGLContextAttributes = { stencil: true };

    /**
     * 摄像机
     */
    get camera()
    {
        if (!this._camera)
        {
            const cameras = getComponentsInChildren(sceneLogic(this.scene).object3D, Camera);
            if (cameras.length === 0)
            {
                const defaultCamObj = serialization.setValue(new Object3D(), { name: 'defaultCamera' });
                object3DLogic(defaultCamObj);
                const cam = new Camera();
                reactive(defaultCamObj).components.push(cam);
                this._camera = cam;
                reactive(sceneLogic(this.scene).object3D).children.push(cameraLogic(cam).object3D);
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
     * 复用的渲染提交对象。
     */
    private _submit: Submit;

    /**
     * 3d场景
     */
    scene: Scene;
    /**
     * 根结点
     */
    get root()
    {
        return sceneLogic(this.scene).object3D;
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

        canvas.addEventListener('webglcontextlost', (event) =>
        {
            event.preventDefault();
            this.contextLost = true;
            console.log('GraphicsDevice: WebGL context lost.');
        }, false);

        canvas.addEventListener('webglcontextrestored', () =>
        {
            this.contextLost = false;
            console.log('GraphicsDevice: WebGL context restored.');
        }, false);

        if (!scene)
        {
            const sceneObj = serialization.setValue(new Object3D(), { name: 'scene' });
            object3DLogic(sceneObj);
            const sceneComp = new Scene();
            reactive(sceneObj).components.push(sceneComp);
            scene = sceneComp;
        }
        this.scene = scene;
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
        ticker.onframe(this.update, this);
    }

    stop()
    {
        ticker.offframe(this.update, this);
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

        sceneLogic(this.scene).update(interval);

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

        cameraLogic(this.camera).lens.aspect = this.viewRect.width / this.viewRect.height;

        // 设置鼠标射线
        this.calcMouseRay3D();

        this.scene.mouseRay3D = this.mouseRay3D;
        this.scene.camera = this.camera;

        // 鼠标拾取渲染
        this.selectedObject = this.mouse3DManager.pick(this, this.scene, this.camera);

        if (!webgpu) return;


        // 复用 submit/RenderPass/descriptor 对象引用（见 _submit 注释）。
        const submit = this.getSubmit();
        const renderPass = submit.commandEncoders[0].passEncoders[0] as RenderPass;

        // 每帧更新背景色：整体替换 clearValue 数组引用以触发响应式更新。
        const bg = this.scene.background;
        (renderPass.descriptor.colorAttachments[0] as UnReadonly<RenderPassColorAttachment>).clearValue = [bg.r, bg.g, bg.b, bg.a];

        // 每帧清空渲染对象列表
        (renderPass.renderPassObjects as RenderPassObject[]).length = 0;

        // 绘制阴影图
        shadowRenderer.draw(submit, this.scene, this.camera);
        skyboxRenderer.draw(submit, this.scene, this.camera);
        // 默认渲染
        forwardRenderer.draw(submit, this.scene, this.camera);
        outlineRenderer.draw(submit, this.scene, this.camera);
        wireframeRenderer.draw(submit, this.scene, this.camera);

        //
        webgpu.submit(submit);
    }

    /**
     * 获取复用的渲染提交对象。
     */
    private getSubmit(): Submit
    {
        if (!this._submit)
        {
            this._submit = {
                commandEncoders: [
                    {
                        passEncoders: [
                            {
                                descriptor: {
                                    colorAttachments: [
                                        {
                                            view: { texture: { context: { canvasId: this.canvas } } },
                                            clearValue: [0, 0, 0, 1],
                                        },
                                    ],
                                    depthStencilAttachment: {
                                        depthClearValue: 1,
                                        depthLoadOp: 'clear',
                                        depthStoreOp: 'store',
                                    },
                                }, renderPassObjects: [],
                            },
                        ],
                    },
                ],
            };
        }

        return this._submit;
    }

    /**
     * 屏幕坐标转GPU坐标
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
     */
    project(point3d: Vector3): Vector3
    {
        const v: Vector3 = cameraLogic(this.camera).project(point3d);
        v.x = (v.x + 1.0) * this.viewRect.width / 2.0;
        v.y = (1.0 - v.y) * this.viewRect.height / 2.0;

        return v;
    }

    /**
     * 屏幕坐标投影到场景坐标
     */
    unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
    {
        const gpuPos: Vector2 = this.screenToGpuPosition(new Vector2(sX, sY));

        return cameraLogic(this.camera).unproject(gpuPos.x, gpuPos.y, sZ, v);
    }

    /**
     * 获取单位像素在指定深度映射的大小
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        let scale = cameraLogic(this.camera).getScaleByDepth(depth, dir);
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
        this.mouseRay3D = cameraLogic(this.camera).getRay3D(gpuPos.x, gpuPos.y);
    }

    /**
     * 获取屏幕区域内所有游戏对象
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
        const gs: Object3D[] = [];
        const sceneObj = sceneLogic(this.scene).object3D;
        const _object3Ds: Object3D[] = [sceneObj];
        while (_object3Ds.length > 0)
        {
            const object3D = _object3Ds.pop();
            if (object3D === sceneObj) { /* skip scene root */ }
            else
            {
                const m = object3D.components.find(c => c instanceof Renderable) as Renderable;
                let include: boolean;
                if (m)
                {
                    include = renderableLogic(m).selfWorldBounds.value.toPoints().every((pos) =>
                    {
                        const p = this.project(pos);

                        return rect.contains(p.x, p.y);
                    });
                }
                else
                {
                    const p = this.project(transformLogic(object3D).worldPosition.value);

                    include = rect.contains(p.x, p.y);
                }
                if (include)
                {
                    gs.push(object3D);
                }
            }
            _object3Ds.push(...object3D.children as Object3D[]);
        }

        return gs;
    }

    protected selectedObject: Object3D;

    static createNewScene()
    {
        const sceneObj = serialization.setValue(new Object3D(), { name: 'Untitled' });
        object3DLogic(sceneObj);
        const scene = new Scene();
        reactive(sceneObj).components.push(scene);
        scene.background.setTo(0.2784, 0.2784, 0.2784);
        scene.ambientColor.setTo(0.4, 0.4, 0.4);

        const camera = createPrimitive('Camera', { name: 'Main Camera' });
        const audioListener = new AudioListener();
        reactive(camera).components.push(audioListener);
        {
            const _r_pos = reactive(camera.position);
            batchRun(() => { _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10; });
        }
        reactive(sceneLogic(scene).object3D).children.push(camera);

        const directionalLight = serialization.setValue(new Object3D(), { name: 'DirectionalLight' });
        object3DLogic(directionalLight);
        const dl = new DirectionalLight();
        reactive(directionalLight).components.push(dl);
        dl.shadowType = ShadowType.Hard_Shadows;
        {
            const _r_rot = reactive(directionalLight.rotation);
            batchRun(() => { _r_rot.x = 50; _r_rot.y = -30; });
        }
        reactive(directionalLight.position).y = 3;
        reactive(sceneLogic(scene).object3D).children.push(directionalLight);

        return scene;
    }
}

// WebGPU 设备异步初始化；未就绪时 render() 会跳过提交。
let webgpu: WebGPU;
void new WebGPU().init().then((gpu) => { webgpu = gpu; }).catch((err) =>
{
    console.error('[View] WebGPU 初始化失败:', err);
});
