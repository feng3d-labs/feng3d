import { Ray3, Rectangle, Vector2, Vector3 } from '@feng3d/math';
import { batchRun, computed, logic, reactive } from '@feng3d/reactivity';
import { windowEventProxy } from '@feng3d/shortcut';
import { CanvasContext, CanvasTexture, Color, PassEncoder, RenderPass, RenderPassDescriptor, Submit, Texture, TextureSize, TextureView, WebGPU } from '@feng3d/webgpu';
import { createAudioListener } from "../audio/AudioListener";
import { Camera, createCamera } from "../cameras/Camera";
import { isRenderable } from "../component/Component";
import { getComponentsInChildren } from '../component/componentQuery';
import { createDirectionalLight } from "../light/DirectionalLight";
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { createScene, Scene } from "../scene/Scene";
import { skyboxRenderer } from '../skybox/SkyBoxRenderer';
import { ticker } from '../utils/Ticker';
import { createObject3D } from './createObject3D';
import { Feng3dObject } from './Feng3dObject';
import { Mouse3DManager, WindowMouseInput } from './Mouse3DManager';
import { createPrimitive, Object3D } from './Object3D';
import type { Renderable } from './Renderable';

/**
 * 视图
 */
export class View extends Feng3dObject
{
    //
    readonly canvas: HTMLCanvasElement;

    private _contextAttributes: WebGLContextAttributes = { stencil: true };

    /**
     * 摄像机
     */
    get camera()
    {
        if (!this._camera)
        {
            const cameras = getComponentsInChildren(logic(this.scene).entity, 'Camera');
            if (cameras.length === 0)
            {
                const defaultCamObj = Object.assign(createObject3D(), { name: 'defaultCamera' });
                logic(defaultCamObj);
                const cam = createCamera();
                reactive(defaultCamObj).components.push(cam);
                this._camera = cam;
                reactive(logic(this.scene).entity).children.push(logic(cam).entity);
            }
            else
            {
                this._camera = cameras[0] as any;
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
        return logic(this.scene).entity;
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
     * @param canvas       画布
     * @param sceneObject3D  场景根 Object3D（自动触发 logic 初始化，自动查找 Scene 与 Camera 组件）
     */
    constructor(canvas?: HTMLCanvasElement, sceneObject3D?: Object3D, contextAttributes?: WebGLContextAttributes)
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

        reactive(this as { canvas: HTMLCanvasElement }).canvas = canvas;
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

        if (!sceneObject3D)
        {
            sceneObject3D = Object.assign(createObject3D(), { name: 'scene' });
            const sceneComp = createScene();
            reactive(sceneObject3D).components.push(sceneComp);
        }

        // 触发 logic：注册 entityLogic（组件自动初始化）与 containerLogic（子级自动同步 parent）
        logic(sceneObject3D);

        // 从 sceneObject3D 中自动获取 Scene 与 Camera 组件
        const scene = sceneObject3D.components.find(c => c.__type__ === 'Scene') as Scene;
        const camera = getComponentsInChildren<Camera>(sceneObject3D, 'Camera')[0];

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

        logic(this.scene).update(interval);

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        reactive(this._canvaSize).width = this.canvas.width || this.canvas.clientWidth || 1;
        reactive(this._canvaSize).height = this.canvas.height || this.canvas.clientHeight || 1;

        // 每帧 ++ 版本号，驱动 ForwardRenderer.draw 的 computed 重算（_Time 等非响应式量靠它接入链路）
        reactive(this._frameVersion).v++;

        if (this.canvas.width * this.canvas.height === 0) return;

        const clientRect = this.canvas.getBoundingClientRect();

        this.viewRect.x = clientRect.left;
        this.viewRect.y = clientRect.top;
        this.viewRect.width = clientRect.width;
        this.viewRect.height = clientRect.height;

        this.mousePos.x = windowEventProxy.clientX - clientRect.left;
        this.mousePos.y = windowEventProxy.clientY - clientRect.top;

        logic(this.camera).lens.aspect = this.viewRect.width / this.viewRect.height;

        // 设置鼠标射线
        this.calcMouseRay3D();

        reactive(this.scene).mouseRay3D = this.mouseRay3D;
        reactive(this.scene).camera = this.camera;

        // 鼠标拾取渲染
        this.selectedObject = this.mouse3DManager.pick(this, this.scene, this.camera);

        if (!webgpu) return;

        // 所有 renderer（shadow / skybox / forward / outline / wireframe）均由
        // _submitComputed / _canvasRenderPassComputed 内部通过响应式链求值，
        // 不再在 render() 主动调用——每帧 _frameVersion++ 自动级联。

        const submit: Submit = this._submitComputed.value;

        //
        webgpu.submit(submit);
    }

    private _canvasRenderPassComputed = (() =>
    {
        let renderPass: RenderPass;

        return computed(() =>
        {
            if (!renderPass)
            {
                renderPass = {
                    descriptor: this._canvasRenderPassDescriptorComputed.value, renderPassObjects: [],
                };
            }

            // 接入各 renderer 响应式链：
            // 每帧 _frameVersion++ → 各 draw computed 失效 → 返回新 RenderObject[]
            // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            //
            // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
            // skybox 在最前作为背景画，forward 物体覆盖其上；
            // outline / wireframe 当前为空实现（TODO），未来接入后画在最上层。
            const skyboxObjects = skyboxRenderer.draw(this.scene, this.camera, this._frameVersionComputed).value;
            const forwardObjects = forwardRenderer.draw(this.scene, this.camera, this._frameVersionComputed).value;
            const outlineObjects = outlineRenderer.draw(this.scene, this.camera, this._frameVersionComputed).value;
            const wireframeObjects = wireframeRenderer.draw(this.scene, this.camera, this._frameVersionComputed).value;
            reactive(renderPass).renderPassObjects = [
                ...skyboxObjects,
                ...forwardObjects,
                ...outlineObjects,
                ...wireframeObjects,
            ];

            return renderPass;
        });
    })();

    private _submitComputed = (() =>
    {
        let submit: Submit;
        let passEncoders: PassEncoder[];

        return computed(() =>
        {
            if (!submit)
            {
                submit = { commandEncoders: [{ passEncoders: passEncoders = [] }] };
            }

            // 接入 ShadowRenderer 响应式链：
            // 每帧 _frameVersion++ → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
            //
            // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
            // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
            const shadowPasses = shadowRenderer.draw(this.scene, this.camera, this._frameVersionComputed).value;
            for (let i = 0; i < shadowPasses.length; i++)
            {
                passEncoders[i] = shadowPasses[i];
            }
            // 主 Pass 固定排在阴影 Pass 之后
            passEncoders[shadowPasses.length] = this._canvasRenderPassComputed.value;
            // 截断多余元素（光源减少时旧 Pass 不再执行）
            passEncoders.length = shadowPasses.length + 1;

            return submit;
        });
    })();

    readonly _canvaSize: { readonly width: number, readonly height: number } = { width: 1, height: 1 };

    /**
     * 帧版本号。
     *
     * 每帧 render() 中 `++v`，作为渲染对象列表 computed 的响应式驱动源：
     * `_Time`（Date.now）等非响应式量通过此版本号接入响应式链。
     * 与 `_canvaSize` 同范式（readonly 字段，内部属性可变，通过 reactive 代理写入）。
     */
    readonly _frameVersion: { readonly v: number } = { v: 0 };

    /**
     * 把 _frameVersion.v 包装成 Computed<number>，方便传给 ForwardRenderer.draw。
     *
     * draw 的 computed 内部读 `.value` 建立依赖，本字段 `++` 时失效级联。
     */
    private _frameVersionComputed = computed(() => reactive(this._frameVersion).v);

    private _depthTextureComputed = (() =>
    {
        let depthTexture: Texture;
        let size: TextureSize;
        const r_this = reactive(this);

        return computed(() =>
        {
            if (!depthTexture)
            {
                depthTexture = { descriptor: { size: size = [1, 1], format: 'depth24plus' } };
            }

            //
            reactive(size)[0] = r_this._canvaSize.width;
            reactive(size)[1] = r_this._canvaSize.height;

            //
            return depthTexture;
        });
    })();

    private _canvasTexture = (() =>
    {
        let canvasTexture: CanvasTexture;
        let context: CanvasContext;
        const r_this = reactive(this);

        return computed(() =>
        {
            //
            if (!canvasTexture)
            {
                canvasTexture = { context: context = { canvasId: null } };
            }
            //
            r_this.canvas;

            reactive(context).canvasId = this.canvas;

            return canvasTexture;
        });
    })();

    private _canvasRenderPassDescriptorComputed = (() =>
    {
        let descriptor: RenderPassDescriptor;
        let view: TextureView;
        let depthStencilView: TextureView;
        const r_this = reactive(this);

        const clearValue = computed(() =>
        {
            const bg = r_this.scene.background;
            return [bg.r, bg.g, bg.b, bg.a] as Color;
        });

        return computed(() =>
        {
            if (!descriptor)
            {
                descriptor = {
                    colorAttachments: [
                        {
                            view: view = { texture: null },
                            clearValue: [0, 0, 0, 1],
                        },
                    ],
                    depthStencilAttachment: {
                        view: depthStencilView = { texture: null },
                        depthClearValue: 1,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                    },
                }
            }

            //
            reactive(depthStencilView).texture = this._depthTextureComputed.value;
            reactive(view).texture = this._canvasTexture.value;
            reactive(descriptor.colorAttachments[0]).clearValue = clearValue.value;

            return descriptor;
        });
    })();

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
        const v: Vector3 = logic(this.camera).project(point3d);
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

        return logic(this.camera).unproject(gpuPos.x, gpuPos.y, sZ, v);
    }

    /**
     * 获取单位像素在指定深度映射的大小
     */
    getScaleByDepth(depth: number, dir = new Vector2(0, 1))
    {
        let scale = logic(this.camera).getScaleByDepth(depth, dir);
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
        this.mouseRay3D = logic(this.camera).getRay3D(gpuPos.x, gpuPos.y);
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
        const sceneObj = logic(this.scene).entity;
        const _object3Ds: Object3D[] = [sceneObj as Object3D];
        while (_object3Ds.length > 0)
        {
            const object3D = _object3Ds.pop();
            if (object3D === sceneObj) { /* skip scene root */ }
            else
            {
                const m = object3D.components.find(c => isRenderable(c)) as Renderable;
                let include: boolean;
                if (m)
                {
                    include = logic(m).selfWorldBounds.value.toPoints().every((pos) =>
                    {
                        const p = this.project(pos);

                        return rect.contains(p.x, p.y);
                    });
                }
                else
                {
                    const p = this.project(logic(object3D).worldPosition.value);

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
        const sceneObj = Object.assign(createObject3D(), { name: 'Untitled' });
        logic(sceneObj);
        const scene = createScene();
        reactive(sceneObj).components.push(scene);
        reactive(scene).background = { __type__: 'Color4', r: 0.2784, g: 0.2784, b: 0.2784, a: 1 };
        reactive(scene).ambientColor = { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 };

        const camera = createPrimitive('Camera', { name: 'Main Camera' });
        const audioListener = createAudioListener();
        reactive(camera).components.push(audioListener);
        {
            const _r_pos = reactive(camera.position);
            batchRun(() => { _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10; });
        }
        reactive(logic(scene).entity).children.push(camera);

        const directionalLight = Object.assign(createObject3D(), { name: 'DirectionalLight' });
        logic(directionalLight);
        const dl = createDirectionalLight();
        reactive(directionalLight).components.push(dl);
        reactive(dl).shadowType = ShadowType.Hard_Shadows;
        {
            const _r_rot = reactive(directionalLight.rotation);
            batchRun(() => { _r_rot.x = 50; _r_rot.y = -30; });
        }
        reactive(directionalLight.position).y = 3;
        reactive(logic(scene).entity).children.push(directionalLight);

        return scene;
    }
}

// WebGPU 设备异步初始化；未就绪时 render() 会跳过提交。
let webgpu: WebGPU;
void new WebGPU().init().then((gpu) => { webgpu = gpu; }).catch((err) =>
{
    console.error('[View] WebGPU 初始化失败:', err);
});

/**
 * 获取全局 WebGPU 实例（含 device）。
 *
 * WebGPU 异步初始化，首次调用可能返回 undefined（尚未就绪）。
 * 用于外部获取 GPUDevice 做 GPU 资源统计/分析（见 `getGPUDeviceStats`）。
 */
export function getWebGPU(): WebGPU | undefined
{
    return webgpu;
}
