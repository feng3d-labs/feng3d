import { batchRun, Computed, computed, logic as getLogic, reactive, registerLogic } from '@feng3d/reactivity';
import { CanvasContext, CanvasTexture, Color, PassEncoder, RenderPass, RenderPassDescriptor, Submit, Texture, TextureSize, TextureView } from '@feng3d/webgpu';
import { createAudioListener } from "../audio/AudioListener";
import { Camera, createCamera } from "../cameras/Camera";
import { getComponentsInChildren } from '../component/componentQuery';
import { createDirectionalLight } from "../light/DirectionalLight";
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { createScene, Scene } from "../scene/Scene";
import { skyboxRenderObject } from '../skybox/SkyBox';
import { createObject3D } from './createObject3D';
import { createPrimitive, Object3D } from './Object3D';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        View: ViewLogic;
    }
}

/**
 * 视图（纯数据接口）。
 *
 * 持有 canvas / scene / camera 三个数据字段，所有行为（渲染、提交链构建、帧驱动）
 * 由 {@link ViewLogic} 提供，通过 `logic(view)` 获取。
 *
 * 由 {@link createView} 工厂创建实例。
 */
export interface View
{
    readonly __type__: 'View';

    /**
     * 画布。
     */
    readonly canvas: HTMLCanvasElement;

    /**
     * 3d场景。
     */
    readonly scene: Scene;

    /**
     * 摄像机（缺省时由 ViewLogic 自动从 scene 中查找或创建默认相机）。
     */
    readonly camera?: Camera;
}

/**
 * View 默认值模板（供 registerLogic 自动填充缺失字段）。
 *
 * canvas/scene 为必填运行时字段，无有意义默认值，此处不列入。
 */
const viewDefaults = {};

/**
 * View 逻辑处理类。
 *
 * 持有渲染提交链（computed）与帧版本号（响应式驱动源）。
 * 通过 `logic(view)` 获取实例，调 `render(interval)` 返回 submit。
 *
 * 渲染对象列表由各 renderer 的 computed 求值（响应式链自动级联），
 * 每帧 `render()` 只需 `++_frameVersion.v` 驱动整条链。
 */
export class ViewLogic
{
    /** 关联的 View 数据（构造函数注入，只读） */
    get view(): View { return this._view; }
    private readonly _view: View;

    /** 画布尺寸（响应式源，每帧 render 同步 canvas.clientWidth/Height） */
    private readonly _canvaSize: { readonly width: number, readonly height: number } = { width: 1, height: 1 };
    /** 帧版本号（响应式源，每帧 render ++v 驱动 renderer computed 重算） */
    private readonly _frameVersion: { readonly v: number } = { v: 0 };

    private readonly _frameVersionComputed: Computed<number>;
    private readonly _depthTextureComputed: Computed<Texture>;
    private readonly _canvasTexture: Computed<CanvasTexture>;
    private readonly _canvasRenderPassDescriptorComputed: Computed<RenderPassDescriptor>;
    private readonly _canvasRenderPassComputed: Computed<RenderPass>;
    private readonly _submitComputed: Computed<Submit>;

    constructor(view: View)
    {
        this._view = view;

        const r_view = reactive(view);

        // camera：缺省时自动查找或创建默认相机
        if (!view.camera)
        {
            const cameras = getComponentsInChildren(getLogic(view.scene).entity, 'Camera');
            if (cameras.length === 0)
            {
                const defaultCamObj = Object.assign(createObject3D(), { name: 'defaultCamera' });
                getLogic(defaultCamObj);
                const cam = createCamera();
                reactive(defaultCamObj).components.push(cam);
                reactive(r_view).camera = cam;
                reactive(getLogic(view.scene).entity).children.push(getLogic(cam).entity);
            }
            else
            {
                reactive(r_view).camera = cameras[0] as any;
            }
        }

        // ── 响应式渲染链 ──────────────────────────────────────────────
        // _frameVersion → 各 renderer computed → renderPassObjects → submit
        // ──────────────────────────────────────────────────────────────

        this._frameVersionComputed = computed(() => reactive(this._frameVersion).v);

        const renderPass: RenderPass = { descriptor: null, renderPassObjects: [] };

        // skyboxRenderObject 读 input.scene/input.camera 建立响应式依赖，
        // 传入 view 本身（scene/camera 字段响应式可追踪）
        const _skyboxObjects = skyboxRenderObject(view as any);

        let descriptor: RenderPassDescriptor;
        let colorView: TextureView;
        let depthStencilView: TextureView;

        const clearValue = computed(() =>
        {
            const bg = r_view.scene.background;

            return [bg.r, bg.g, bg.b, bg.a] as Color;
        });

        this._canvasRenderPassDescriptorComputed = computed(() =>
        {
            if (!descriptor)
            {
                descriptor = {
                    colorAttachments: [
                        {
                            view: colorView = { texture: null },
                            clearValue: [0, 0, 0, 1],
                        },
                    ],
                    depthStencilAttachment: {
                        view: depthStencilView = { texture: null },
                        depthClearValue: 1,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                    },
                };
            }

            reactive(depthStencilView).texture = this._depthTextureComputed.value;
            reactive(colorView).texture = this._canvasTexture.value;
            reactive(descriptor.colorAttachments[0]).clearValue = clearValue.value;

            return descriptor;
        });

        this._canvasRenderPassComputed = computed(() =>
        {
            r_view.camera;
            r_view.scene;

            reactive(renderPass).descriptor = this._canvasRenderPassDescriptorComputed.value;

            // 接入各 renderer 响应式链：
            // 每帧 _frameVersion++ → 各 draw computed 失效 → 返回新 RenderObject[]
            // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            //
            // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
            const skyboxObject = _skyboxObjects.renderObject;
            const forwardObjects = forwardRenderer.draw(view.scene, view.camera, this._frameVersionComputed).value;
            const outlineObjects = outlineRenderer.draw(view.scene, view.camera, this._frameVersionComputed).value;
            const wireframeObjects = wireframeRenderer.draw(view.scene, view.camera, this._frameVersionComputed).value;
            reactive(renderPass).renderPassObjects = [
                ...(skyboxObject ? [skyboxObject] : []),
                ...forwardObjects,
                ...outlineObjects,
                ...wireframeObjects,
            ];

            return renderPass;
        });

        let passEncoders: PassEncoder[];
        const submit: Submit = { commandEncoders: [{ passEncoders: passEncoders = [] }] };

        this._submitComputed = computed(() =>
        {
            // 接入 ShadowRenderer 响应式链：
            // 每帧 _frameVersion++ → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
            //
            // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
            // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
            const shadowPasses = shadowRenderer.draw(view.scene, view.camera, this._frameVersionComputed).value;
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

        let size: TextureSize;
        let depthTexture: Texture = { descriptor: { size: size = [1, 1], format: 'depth24plus' } };

        this._depthTextureComputed = computed(() =>
        {
            // 读 reactive 代理建立依赖（_canvaSize.width 变化时本 computed 失效）
            const r_canvaSize = reactive(this._canvaSize);
            reactive(size)[0] = r_canvaSize.width;
            reactive(size)[1] = r_canvaSize.height;

            return depthTexture;
        });

        let context: CanvasContext;
        let canvasTexture: CanvasTexture = { context: context = { canvasId: null } };

        this._canvasTexture = computed(() =>
        {
            r_view.canvas;

            reactive(context).canvasId = view.canvas;

            return canvasTexture;
        });
    }

    /**
     * 绘制场景，返回 submit（调用方负责 webgpu.submit）。
     *
     * 每帧 ++_frameVersion.v 驱动响应式渲染链重算。
     *
     * @param interval 帧间隔（ms），传给 scene.update
     * @returns 渲染提交对象
     */
    render(interval?: number): Submit
    {
        const view = this._view;
        const scene = view.scene;
        if (!scene) return;

        getLogic(scene).update(interval);

        const canvas = view.canvas;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        reactive(this._canvaSize).width = canvas.width || canvas.clientWidth || 1;
        reactive(this._canvaSize).height = canvas.height || canvas.clientHeight || 1;

        // 每帧 ++ 版本号，驱动 ForwardRenderer.draw 的 computed 重算（_Time 等非响应式量靠它接入链路）
        reactive(this._frameVersion).v++;

        if (canvas.width * canvas.height === 0) return;

        getLogic(view.camera).lens.aspect = canvas.clientWidth / canvas.clientHeight;

        (reactive(scene) as any).camera = view.camera;

        return this._submitComputed.value;
    }

    /**
     * 更新场景（render + 鼠标拾取等后续逻辑由调用方自行追加）。
     */
    update(interval?: number)
    {
        this.render(interval);
    }
}

// 注册到 logic 分发表
registerLogic('View', ViewLogic, viewDefaults);

/**
 * 创建包含默认相机与方向光的新场景（供编辑器等使用）。
 */
export function createNewScene(): Scene
{
    const sceneObj = Object.assign(createObject3D(), { name: 'Untitled' });
    getLogic(sceneObj);
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
    reactive(getLogic(scene).entity).children.push(camera);

    const directionalLight = Object.assign(createObject3D(), { name: 'DirectionalLight' });
    getLogic(directionalLight);
    const dl = createDirectionalLight();
    reactive(directionalLight).components.push(dl);
    reactive(dl).shadowType = ShadowType.Hard_Shadows;
    {
        const _r_rot = reactive(directionalLight.rotation);
        batchRun(() => { _r_rot.x = 50; _r_rot.y = -30; });
    }
    reactive(directionalLight.position).y = 3;
    reactive(getLogic(scene).entity).children.push(directionalLight);

    return scene;
}
