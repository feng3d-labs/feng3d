import { Computed, computed, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { CanvasContext, CanvasTexture, Color, PassEncoder, RenderPass, RenderPassDescriptor, Submit, Texture, TextureSize, TextureView } from '@feng3d/webgpu';
import { Camera, createCamera } from "../cameras/Camera";
import { getComponent, getComponentsInChildren } from '../component/componentQuery';
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { createScene, Scene } from "../scene/Scene";
import { skyboxRenderObject } from '../skybox/SkyBox';
import { createObject3D } from './createObject3D';
import { Object3D } from './Object3D';

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
 * 持有 canvas / root 两个数据字段，所有行为（渲染、提交链构建、帧驱动）
 * 由 {@link ViewLogic} 提供，通过 `logic(view)` 获取。
 *
 * root 为场景根 Object3D，ViewLogic 从中查找 Scene 与 Camera 组件；
 * 缺失时自动创建默认 Scene / Camera。
 */
export interface View
{
    readonly __type__: 'View';

    /**
     * 画布。
     */
    readonly canvas: HTMLCanvasElement;

    /**
     * 场景根 Object3D。
     *
     * ViewLogic 从中查找 Scene 组件（缺则创建默认 Scene）；
     * Camera 同理从 root 子树查找（缺则创建默认相机）。
     */
    readonly root: Object3D;
}

/**
 * ViewLogic 实例接口（由 viewLogic 工厂函数返回）。
 *
 * 通过 `logic(view)` 获取实例（registerLogic 注册了 viewLogic 工厂）。
 *
 * 使用方式：每帧读 submit getter 驱动渲染链（内部同步 canvas 尺寸、更新场景、
 * 求值响应式渲染链），返回 submit 供 webgpu.submit 提交：
 * ```ts
 * ticker.onframe(() =>
 * {
 *     webgpu.submit(viewLogic.submit);
 * });
 * ```
 */
export interface ViewLogic
{
    /**
     * 渲染提交对象（每帧读取驱动整个渲染链）。
     *
     * 读取本 getter 时内部会同步 canvas 尺寸、更新场景、++帧版本号（触发各 renderer
     * computed 失效），然后求值响应式渲染链（阴影 Pass + 主 Pass），
     * 返回 submit 供 webgpu.submit 提交。
     */
    get submit(): Submit;
}

/**
 * ViewLogic 工厂函数。
 *
 * 创建 ViewLogic 实例（持有渲染提交链 computed 与帧版本号）。
 * 通过 registerLogic('View', viewLogic) 注册，
 * 调用方用 `logic(view)` 获取实例。
 *
 * 函数式实现：构造逻辑变为闭包变量，仅暴露 submit getter。
 * submit getter 内部调用 update（同步 canvas/更新场景/++frameVersion）
 * 后返回 submitComputed.value。
 *
 * scene/camera 从 view.root 响应式派生（computed），root 变化时自动重算。
 * 渲染对象列表由各 renderer 的 computed 求值（响应式链自动级联），
 * 每帧 ++frameVersion.v 驱动整条链。
 */
function viewLogic(view: View): ViewLogic
{
    const r_view = reactive(view);

    // 触发 logic：注册 entityLogic（组件自动初始化）与 containerLogic（子级自动同步 parent）
    getLogic(view.root);

    // scene：从 root 查找 Scene 组件；缺失则创建默认 Scene 挂到 root.components。
    // 读 r_view.root 建立响应式依赖——root 替换时本 computed 自动重算。
    // 注意：getComponent 要求原始对象（非响应式代理），用 toRaw 还原。
    const sceneComputed = computed(() =>
    {
        let scene = getComponent<Scene>(toRaw(r_view.root), 'Scene');
        if (!scene)
        {
            scene = createScene();
            r_view.root.components.push(scene);
        }
        return scene;
    });

    // camera：从 root 子树查找 Camera；缺失则创建默认相机挂到 root.children。
    // 同样响应式追踪 root，root 变化时重算。
    const cameraComputed = computed(() =>
    {
        let camera = getComponentsInChildren<Camera>(r_view.root, 'Camera')[0];
        if (!camera)
        {
            const defaultCamObj = Object.assign(createObject3D(), { name: 'defaultCamera' });
            getLogic(defaultCamObj);
            camera = createCamera();
            reactive(defaultCamObj).components.push(camera);
            r_view.root.children.push(getLogic(camera).entity);
        }
        return camera;
    });

    // ── 响应式渲染链 ──────────────────────────────────────────────
    // _frameVersion → 各 renderer computed → renderPassObjects → submit
    // ──────────────────────────────────────────────────────────────

    // 画布尺寸（响应式源，每帧 render 同步 canvas.clientWidth/Height）
    const canvaSize: { readonly width: number, readonly height: number } = { width: 1, height: 1 };
    // 帧版本号（响应式源，每帧 render ++v 驱动 renderer computed 重算）
    const frameVersion: { readonly v: number } = { v: 0 };

    const frameVersionComputed = computed(() => reactive(frameVersion).v);

    const renderPass: RenderPass = { descriptor: null, renderPassObjects: [] };

    // skyboxRenderObject 读 input.scene/input.camera 建立响应式依赖
    const skyboxObjects = skyboxRenderObject({ get scene() { return sceneComputed.value; }, get camera() { return cameraComputed.value; } } as any);

    let descriptor: RenderPassDescriptor;
    let colorView: TextureView;
    let depthStencilView: TextureView;

    const clearValue = computed(() =>
    {
        const bg = reactive(sceneComputed.value).background;

        return [bg.r, bg.g, bg.b, bg.a] as Color;
    });

    let size: TextureSize;
    let depthTexture: Texture = { descriptor: { size: size = [1, 1], format: 'depth24plus' } };

    const depthTextureComputed = computed(() =>
    {
        // 读 reactive 代理建立依赖（canvaSize.width 变化时本 computed 失效）
        const r_canvaSize = reactive(canvaSize);
        reactive(size)[0] = r_canvaSize.width;
        reactive(size)[1] = r_canvaSize.height;

        return depthTexture;
    });

    let context: CanvasContext;
    let canvasTexture: CanvasTexture = { context: context = { canvasId: null } };

    const canvasTextureComputed = computed(() =>
    {
        r_view.canvas;

        reactive(context).canvasId = view.canvas;

        return canvasTexture;
    });

    const canvasRenderPassDescriptorComputed = computed(() =>
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

        reactive(depthStencilView).texture = depthTextureComputed.value;
        reactive(colorView).texture = canvasTextureComputed.value;
        reactive(descriptor.colorAttachments[0]).clearValue = clearValue.value;

        return descriptor;
    });

    const canvasRenderPassComputed = computed(() =>
    {
        reactive(renderPass).descriptor = canvasRenderPassDescriptorComputed.value;

        // 接入各 renderer 响应式链：
        // 每帧 _frameVersion++ → 各 draw computed 失效 → 返回新 RenderObject[]
        // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
        //
        // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
        const skyboxObject = skyboxObjects.renderObject;
        const forwardObjects = forwardRenderer.draw(sceneComputed.value, cameraComputed.value, frameVersionComputed).value;
        const outlineObjects = outlineRenderer.draw(sceneComputed.value, cameraComputed.value, frameVersionComputed).value;
        const wireframeObjects = wireframeRenderer.draw(sceneComputed.value, cameraComputed.value, frameVersionComputed).value;
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

    const submitComputed = computed(() =>
    {
        // 接入 ShadowRenderer 响应式链：
        // 每帧 _frameVersion++ → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
        //
        // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
        // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
        const shadowPasses = shadowRenderer.draw(sceneComputed.value, cameraComputed.value, frameVersionComputed).value;
        for (let i = 0; i < shadowPasses.length; i++)
        {
            passEncoders[i] = shadowPasses[i];
        }
        // 主 Pass 固定排在阴影 Pass 之后
        passEncoders[shadowPasses.length] = canvasRenderPassComputed.value;
        // 截断多余元素（光源减少时旧 Pass 不再执行）
        passEncoders.length = shadowPasses.length + 1;

        return submit;
    });

    /**
     * 更新场景，驱动响应式渲染链重算（内部函数，由 submit getter 调用）。
     *
     * 同步 canvas 尺寸、更新场景、++frameVersion.v（触发各 renderer computed 失效）。
     */
    function update(): void
    {
        const scene = sceneComputed.value;
        if (!scene) return;

        getLogic(scene).update();

        const canvas = view.canvas;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        reactive(canvaSize).width = canvas.width || canvas.clientWidth || 1;
        reactive(canvaSize).height = canvas.height || canvas.clientHeight || 1;

        // 每帧 ++ 版本号，驱动 ForwardRenderer.draw 的 computed 重算（_Time 等非响应式量靠它接入链路）
        reactive(frameVersion).v++;
    }

    return {
        get submit()
        {
            update();
            return submitComputed.value;
        },
    };
}

// 注册到 logic 分发表
registerLogic('View', viewLogic);

/**
 * 创建包含默认相机与方向光的新场景（供编辑器等使用）。
 *
 * 以纯 JSON 字面量声明场景结构（Object3D + 组件），通过 logic() 触发初始化。
 * 返回 root Object3D 中的 Scene 组件（兼容编辑器 gameScene 字段类型）。
 */
export function createNewScene(): Scene
{
    // 纯 JSON 声明场景结构（参照 Container3DTest 范式）
    const root: Object3D = {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.2784, g: 0.2784, b: 0.2784, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: -10 },
            components: [{
                __type__: 'Camera',
            }, {
                __type__: 'AudioListener',
            }],
        }, {
            __type__: 'Object3D',
            name: 'DirectionalLight',
            position: { x: 0, y: 3, z: 0 },
            rotation: { x: 50, y: -30, z: 0 },
            components: [{
                __type__: 'DirectionalLight',
                shadowType: ShadowType.Hard_Shadows,
            }],
        }],
    };

    // 触发 logic：注册 entityLogic（组件自动初始化）与 containerLogic（子级自动同步 parent）
    getLogic(root);

    return root.components.find(c => c.__type__ === 'Scene') as Scene;
}
