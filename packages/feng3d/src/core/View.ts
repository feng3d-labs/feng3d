import { ErrorCode, reportDegradation } from './CodedError';
import { computed, getMutationCount, logic as getLogic, reactive, registerLogic, toRaw, type Computed } from '@feng3d/reactivity';
import { CanvasContext, CanvasTexture, Color, PassEncoder, RenderPass, RenderPassDescriptor, Submit, Texture, TextureSize, TextureView } from '@feng3d/webgpu';
import { Camera } from "../cameras/Camera";
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { Scene } from "../scene/Scene";
import { skyboxRenderObject } from '../skybox/SkyBox';
import { Object3D } from './Object3D';
import { registerPrefabs } from './Prefab';
import type { Renderable } from './Renderable';
import { registerShared, resolveRefs } from './Ref';

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
     * 画布（宿主锚点，设计文档 3.3）。
     *
     * 运行时传 HTMLCanvasElement；序列化时以元素 id 字符串引用，
     * ViewLogic 构造时经 document.getElementById 解析（锚点是封闭集合，
     * 不作为常规扩展手段）。
     */
    readonly canvas: HTMLCanvasElement | string;

    /**
     * 模板定义区（设计文档 3.6 Prefab / 3.7 $ref）。
     *
     * prefabs 在构造时注册到全局 Prefab 注册表；带 prefabId 的节点
     * 在 logic() 触达时实例化。其余子表（如 materials）注册为共享对象，
     * 供 `{ $ref: 'materials/diffuse' }` 引用（多处引用同一实例）。
     */
    readonly defs?: {
        readonly prefabs?: Record<string, Object3D>;
        readonly [key: string]: Record<string, object> | undefined;
    };

    /**
     * 场景根 Object3D。
     *
     * ViewLogic 从中查找 Scene 组件（缺则创建默认 Scene）；
     * Camera 同理从 root 子树查找（缺则创建默认相机）。
     */
    readonly root: Object3D;
}

/**
 * View 逻辑接口（issue #674 工厂范式）。
 *
 * 与纯数据 {@link View} 一一对应：数据字段在 View 上，行为（渲染、提交链构建、帧驱动）
 * 由 {@link viewLogic} 工厂创建的实例提供，通过 `logic(view)` 获取。
 *
 * 形态：**工厂闭包直接返回对象字面量**——无共享原型、无 this、无 `_` 前缀状态字段；
 * 原 class 的 `#field` 状态落在工厂闭包内的 `const` / `let` 上。
 */
export interface ViewLogic
{
    /**
     * 场景（`root` 上的 Scene 组件；缺失时就地创建默认 Scene 并挂到 `root.components`）。
     *
     * 只读 getter（规范 §11.2）：与渲染链读的是同一个 `sceneComputed`，
     * 供渲染链之外的消费方（如 `@feng3d/ui` 的 UI 绘制）取场景而无需自己重查 `root.components`。
     */
    readonly scene: Scene;

    /**
     * 宿主画布元素（`view.canvas` 为字符串时按元素 id 解析，见设计文档 3.3）。
     *
     * 只读 getter（规范 §11.2）：`View.canvas` 的类型是 `HTMLCanvasElement | string`，
     * 解析逻辑是内部 `resolveCanvas`，这里作为公开只读入口暴露给画布尺寸消费方
     * （如 `@feng3d/ui` 的 UI 布局）。
     */
    readonly canvasElement: HTMLCanvasElement;

    /**
     * 渲染提交对象（每帧读取驱动整个渲染链）。
     *
     * 读取本 getter 时内部会同步 canvas 尺寸、更新场景，然后求值响应式渲染链
     * （阴影 Pass + 主 Pass），返回 submit 供 webgpu.submit 提交。
     */
    readonly submit: Submit;
}

/** 宿主锚点解析（设计文档 3.3）：字符串按元素 id 解析为 HTMLCanvasElement */
function resolveCanvas(view: View): HTMLCanvasElement
{
    const c = toRaw(reactive(view).canvas);

    // editor 的编译上下文里 `HTMLCanvasElement` 有**两种来源**（两套 lib.dom 声明），结构相同却不能直接互赋；
    // 这里在返回处各加一次窄断言（运行时是同一个对象）。根因与 `TextureField` 的 13 条同类，见 #133 / #360。
    return typeof c === 'string' ? (document.getElementById(c) as HTMLCanvasElement) : (c as HTMLCanvasElement);
}

/**
 * 更新场景（内部方法，由 submit getter 调用）。
 *
 * 同步 canvas 尺寸、同步相机 aspect、驱动场景 Behaviour update。
 * 渲染链失效完全由数据变化驱动（无每帧全局失效源）。
 */
function updateView(
    view: View,
    sceneComputed: Computed<Scene>,
    cameraComputed: Computed<Camera>,
    canvaSize: { readonly width: number; readonly height: number },
): void
{
    const scene = sceneComputed.value;
    if (!scene) return;

    getLogic(scene).update();

    const canvas = resolveCanvas(view);
    // 画布布局尺寸为 0 时（面板卸载后 canvas 移出 DOM、窗口最小化、display:none）
    // **不要把 canvas.width/height 写成 0**：WebGPU 的画布纹理尺寸就是 canvas 的
    // width/height，0×0 会让 `getCurrentTexture()` 报 "texture size is empty"，
    // 并连锁污染后续命令（CreateView / BeginRenderPass / Submit 全失败——
    // 实测反复卸载/重建场景视图刷出 90 条未捕获错误，issue #154）。
    // 保持上一次的有效尺寸，等布局恢复后再同步（下面的 `|| 1` 兜底只护住自己的尺寸变量，
    // 护不住 Dawn 看到的 canvas 尺寸，两者不一致正是这个问题的根源）。
    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    if (clientWidth > 0 && clientHeight > 0)
    {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    }

    reactive(canvaSize).width = canvas.width || canvas.clientWidth || 1;
    reactive(canvaSize).height = canvas.height || canvas.clientHeight || 1;

    // 自动同步相机 aspect 与画布宽高比（PerspectiveCamera 才有 aspect 字段）。
    // 避免画布尺寸变化时投影矩阵 aspect 滞后导致立方体被拉伸为长方体。
    const camera = cameraComputed.value as Camera & { aspect?: number };
    const h = canvas.height || canvas.clientHeight || 1;
    if (camera && 'aspect' in camera)
    {
        reactive(camera).aspect = (canvas.width || canvas.clientWidth || 1) / h;
    }

    // 额外 Pass 的每帧准备（上层扩展包注册，如 UI 的画布布局）。
    // 必须在渲染链求值**之前**完成：布局写入若发生在 computed 求值期间，
    // 等于在求值里写回自己依赖的字段（自激失效）。
    const passContext: ViewPassContext = {
        scene,
        camera,
        viewport: [canvaSize.width, canvaSize.height],
        canvas,
    };
    const providers = getViewPassProviders();
    for (let i = 0; i < providers.length; i++)
    {
        providers[i].update?.(view, passContext);
    }
}

/**
 * 工厂函数：ViewLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 形态：**工厂闭包直接返回对象字面量**——没有共享原型、没有 this、没有 `_` 前缀状态字段；
 * 内部辅助（resolveCanvas / updateView）是模块级函数，其余状态与计算链按原声明顺序落在闭包内。
 *
 * @param view 视图数据（raw）
 */
export function viewLogic(view: View): ViewLogic
{
    const logic: ViewLogic = {
        get scene() { return sceneComputed.value; },
        get canvasElement() { return resolveCanvas(view); },
        get submit(): Submit
        {
            updateView(view, sceneComputed, cameraComputed, canvaSize);

            let s: Submit;
            try
            {
                s = submitComputed.value;
            }
            catch (e)
            {
                // 拉取模型的优势：异常收敛到唯一的消费入口（设计文档 8.1）
                if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production' && lastValidSubmit)
                {
                    reportDegradation(ErrorCode.SubmitComputeFailed, { error: e });
                    s = lastValidSubmit;
                }
                else
                {
                    // dev：附数据上下文定位（设计 8.1「哪个节点」的 v1 形态——完整依赖链
                    // 摘要待第 9 章 devtools 计算图可视化）。求值链顶层节点 = root/scene/camera。
                    reportDegradation(ErrorCode.SubmitEvaluateFailed, {
                        canvas: typeof view.canvas === 'string' ? `#${view.canvas}` : '(element)',
                        root: view.root?.name ?? '(未命名)',
                        scene: view.root?.components?.find(c => (c as { __type__?: string }).__type__ === 'Scene') ? 'Scene 组件' : '(未找到)',
                        camera: cameraComputed.value ? (cameraComputed.value as { __type__: string }).__type__ : '(未解析)',
                    });
                    throw e;
                }
            }
            lastValidSubmit = s;

            // 按需呈现（框架设计文档 4.2）：以全局变更计数为版本号。
            // update/求值期间的数据写入（脚本、响应式失效级联）都已完成，
            // 此处打戳；webgpu.submit 对比版本相同则跳过编码与提交。
            // 非响应式内容源（视频纹理等）需调用 markMutation() 显式标记。
            (s as { version?: number }).version = getMutationCount();

            return s;
        },
    };

    // ---- 装配期状态（内部字段；惰性创建 / 装配中赋值的用 let） ----
    let descriptor: RenderPassDescriptor;
    let colorView: TextureView;
    let depthStencilView: TextureView;
    let lastValidSubmit: Submit | undefined;

    // ---- 原实例字段初始化（按原声明顺序） ----
    // scene：从 root 查找 Scene 组件；缺失则创建默认 Scene 挂到 root.components。
    // 读 r_view.root 建立响应式依赖——root 替换时本 computed 自动重算。
    const sceneComputed = computed(() =>
    {
        let scene = getLogic(toRaw(reactive(view).root)).getComponent<Scene>('Scene');
        if (!scene)
        {
            scene = { __type__: 'Scene' } as Scene;
            reactive(view).root.components!.push(scene);
        }

        return scene;
    });

    // camera：从 root 子树查找 Camera；缺失则创建默认 PerspectiveCamera 挂到 root.children。
    // 同样响应式追踪 root，root 变化时重算。
    const cameraComputed = computed(() =>
    {
        const r_view = reactive(view);
        const r_root = r_view.root;   // 响应式读取建立依赖
        let camera = getLogic(toRaw(r_root)).getComponentsInChildren<Camera>('Camera')[0];
        if (!camera)
        {
            const defaultCamObj = { __type__: 'Object3D', name: 'defaultCamera' } as Object3D;
            getLogic(defaultCamObj);
            camera = { __type__: 'PerspectiveCamera' } as Camera;
            reactive(defaultCamObj).components!.push(camera);
            r_root.children!.push(getLogic(camera).entity as Object3D);
        }

        return camera;
    });

    // ── 响应式渲染链 ──────────────────────────────────────────────
    // 数据（场景树/相机/光源/画布尺寸）→ 各 renderer computed → renderPassObjects → submit
    // 变更驱动失效（框架设计文档 4.1）：无每帧全局失效源，静态场景零重算。
    // ─────────────────────────────────────────────────────────────

    // 画布尺寸（响应式源，每帧 render 同步 canvas.clientWidth/Height）
    const canvaSize = { width: 1, height: 1 };

    // 初始占位：descriptor 由 canvasRenderPassDescriptorComputed 填充（strictNullChecks 下按占位语义断言）
    const renderPass: RenderPass = { descriptor: null as unknown as RenderPassDescriptor, renderPassObjects: [] };

    const clearValue = computed(() =>
    {
        const bg = reactive(sceneComputed.value).background ?? { r: 0, g: 0, b: 0, a: 1 };

        return [bg.r, bg.g, bg.b, bg.a] as Color;
    });

    const size: TextureSize = [1, 1];

    const depthTextureComputed = computed(() =>
    {
        // 读 reactive 代理建立依赖（canvaSize.width 变化时本 computed 失效）
        const r_canvaSize = reactive(canvaSize);
        reactive(size)[0] = r_canvaSize.width;
        reactive(size)[1] = r_canvaSize.height;

        return depthTexture;
    });

    // 画布像素尺寸（响应式，canvaSize 变化时失效），供需要屏幕空间尺寸的着色器使用
    // （如 PointMaterial billboard 按像素展开方形点）。ForwardRenderer 注入 globalUniforms.u_Viewport。
    const viewportComputed = computed<readonly [number, number]>(() =>
    {
        const r_canvaSize = reactive(canvaSize);

        return [r_canvaSize.width, r_canvaSize.height];
    });

    const context: CanvasContext = { canvasId: null as unknown as CanvasContext['canvasId'] };

    const canvasTextureComputed = computed(() =>
    {
        reactive(view).canvas;

        reactive(context).canvasId = resolveCanvas(view);

        return canvasTexture;
    });

    const canvasRenderPassDescriptorComputed = computed(() =>
    {
        if (!descriptor)
        {
            descriptor = {
                colorAttachments: [
                    {
                        view: colorView = { texture: null as unknown as TextureView['texture'] },
                        clearValue: [0, 0, 0, 1],
                    },
                ],
                depthStencilAttachment: {
                    view: depthStencilView = { texture: null as unknown as TextureView['texture'] },
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
        }

        reactive(depthStencilView).texture = depthTextureComputed.value;
        reactive(colorView).texture = canvasTextureComputed.value;
        reactive(descriptor.colorAttachments![0]!).clearValue = clearValue.value;

        return descriptor;
    });

    const canvasRenderPassComputed = computed(() =>
    {
        reactive(renderPass).descriptor = canvasRenderPassDescriptorComputed.value;

        // 接入各 renderer 响应式链：
        // 数据变化 → 各 draw computed 失效 → 返回新 RenderObject[]
        // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
        //
        // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
        const skyboxObject = skyboxObjects.renderObject;
        const forwardObjects = forwardRenderer.draw(sceneComputed.value, cameraComputed.value, viewportComputed).value;
        const outlineObjects = outlineRenderer.draw(sceneComputed.value, cameraComputed.value).value;
        const wireframeObjects = wireframeRenderer.draw(sceneComputed.value, cameraComputed.value).value;
        reactive(renderPass).renderPassObjects = [
            ...(skyboxObject ? [skyboxObject] : []),
            ...forwardObjects,
            ...outlineObjects,
            ...wireframeObjects,
        ];

        return renderPass;
    });

    const passEncoders: PassEncoder[] = [];

    /**
     * 额外渲染 Pass（按 provider 名缓存）。
     *
     * 缓存对象而非每帧新建：`RenderPass.descriptor` 的附件描述与下游 GPU 资源绑定，
     * 每帧换新对象会让下游反复重建资源（与主 Pass 只建一次 `renderPass` 同理）。
     */
    const extraPasses = new Map<string, RenderPass>();

    const submitComputed = computed(() =>
    {
        const scene = sceneComputed.value;
        const camera = cameraComputed.value;

        // 接入 ShadowRenderer 响应式链：
        // 光源/渲染对象变化 → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
        //
        // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
        // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
        const shadowPasses = shadowRenderer.draw(scene, camera).value;
        for (let i = 0; i < shadowPasses.length; i++)
        {
            passEncoders[i] = shadowPasses[i];
        }
        // 主 Pass 固定排在阴影 Pass 之后
        const mainPassIndex = shadowPasses.length;
        passEncoders[mainPassIndex] = canvasRenderPassComputed.value;
        let passCount = mainPassIndex + 1;

        // 额外 Pass（上层扩展包注册，如 UI）：固定排在主 Pass 之后。
        // 颜色附件用 'load' 保留已画好的主场景 → 额外 Pass 是叠加层（UI 因此覆盖在 3D 之上）。
        // 深度附件沿用主 Pass 的视图：额外 Pass 的管线若声明了 depthStencil 状态
        // （UI 材质就是 depthCompare:'always' + 不写深度），缺附件会与管线不兼容。
        const passContext: ViewPassContext = {
            scene,
            camera,
            viewport: viewportComputed.value,
            canvas: resolveCanvas(view),
        };
        const providers = getViewPassProviders();
        for (let i = 0; i < providers.length; i++)
        {
            const provider = providers[i];
            // collect 只读——它读到的场景 / 组件数据建立响应式依赖（UI 树变化 → 本 computed 失效）
            const renderables = provider.collect(view, passContext);
            if (renderables.length === 0) continue;

            let pass = extraPasses.get(provider.name);
            if (!pass)
            {
                pass = {
                    descriptor: {
                        colorAttachments: [{
                            view: colorView,
                            loadOp: 'load',
                            storeOp: 'store',
                        }],
                        depthStencilAttachment: {
                            view: depthStencilView,
                            depthLoadOp: 'load',
                            depthStoreOp: 'store',
                        },
                    },
                    renderPassObjects: [],
                };
                extraPasses.set(provider.name, pass);
            }
            reactive(pass).renderPassObjects = forwardRenderer.prepareExtraRenderObjects(scene, passContext.viewport, renderables);
            passEncoders[passCount++] = pass;
        }
        // 截断多余元素（光源减少 / 某额外 Pass 本帧无内容时旧 Pass 不再执行）
        passEncoders.length = passCount;

        return submitObject;
    });

    // ---- 原构造函数体 ----

    // 资源包装实例（构造期一次性创建，computed 懒引用）
    const depthTexture: Texture = { descriptor: { size, format: 'depth24plus' } };
    const canvasTexture: CanvasTexture = { context };
    const submitObject: Submit = { commandEncoders: [{ passEncoders }] };

    const r_view = reactive(view);

    // 注册 Prefab 模板（设计文档 3.6）与共享对象（3.7）：defs → 全局注册表
    const defs = toRaw(r_view.defs);
    if (defs)
    {
        if (defs.prefabs) registerPrefabs(defs.prefabs);
        for (const key in defs)
        {
            if (key === 'prefabs') continue;
            const table = defs[key];
            if (table)
            {
                // 双注册：全路径键（设计文档语法 `$ref: 'materials/red'`，与
                // liftSharedRefs 保存侧输出一致）+ 扁平键（仅条目名，向后兼容）
                const fullTable: Record<string, object> = {};
                for (const name in table)
                {
                    fullTable[name] = table[name];
                    fullTable[`${key}/${name}`] = table[name];
                }
                registerShared(fullTable);
                for (const name in table) resolveRefs(table[name]);   // defs 内部引用预解析
            }
        }
    }

    // 触发 logic：注册 EntityLogic（组件自动初始化）与 ContainerLogic（子级自动同步 parent）
    getLogic(view.root);

    // skyboxRenderObject 读 input.scene/input.camera 建立响应式依赖
    const skyboxObjects = skyboxRenderObject({
        get scene() { return sceneComputed.value; },
        get camera() { return cameraComputed.value; },
    });

    return logic;
}

// 注册到 logic 分发表
registerLogic('View', viewLogic);

/**
 * 额外渲染 Pass 的上下文（{@link ViewPassProvider} 在每帧准备 / 收集时收到）。
 */
export interface ViewPassContext
{
    /** 场景 */
    readonly scene: Scene;
    /** 相机 */
    readonly camera: Camera;
    /** 画布像素尺寸 */
    readonly viewport: readonly [number, number];
    /** 宿主画布元素 */
    readonly canvas: HTMLCanvasElement;
}

/**
 * 额外渲染 Pass 的提供者（上层扩展包在模块顶层用 {@link registerViewPass} 注册）。
 *
 * 用途：让上层包（如 `@feng3d/ui`）拥有自己的渲染 Pass——与主场景的相机 / 光照 / 视锥
 * 完全解耦，绘制顺序由 {@link ViewPassProvider.collect} 决定。
 *
 * 配套约定：组件用 `registerComponentType(type, { renderPass: <本 provider 的 name> })` 登记，
 * `ScenePickCache` 就会把它排除出主场景渲染列表（**拾取列表不受影响**），避免重复绘制。
 */
export interface ViewPassProvider
{
    /** pass 名（与组件登记的 `renderPass` 对应；同名重复注册时后者覆盖前者） */
    readonly name: string;

    /**
     * 每帧准备（在渲染链求值**之前**调用）。
     *
     * UI 的画布布局挂在这里：布局写入必须发生在求值之前，否则等于在 computed 求值期间
     * 写回自己依赖的字段（自激失效）。
     */
    update?(view: View, context: ViewPassContext): void;

    /**
     * 收集本帧要渲染的对象（按绘制顺序，先画的在前）。
     *
     * 调用发生在渲染链求值期间，本方法必须**只读**：读到的场景 / 组件数据会建立响应式依赖，
     * 上层包的数据变化时本 pass 自动重算。
     *
     * @returns 渲染对象列表；返回空数组表示本帧该 pass 无内容（不产生 pass）
     */
    collect(view: View, context: ViewPassContext): readonly Renderable[];
}

/** 额外 Pass 提供者注册表（lazy-init，R2：import 期创建缓存会被门禁拦下） */
let _viewPassProviders: ViewPassProvider[] | null = null;

/**
 * 取已注册的额外 Pass 提供者（调用方只读遍历；未注册时返回空数组）。
 */
export function getViewPassProviders(): readonly ViewPassProvider[]
{
    return _viewPassProviders || [];
}

/**
 * 注册一个额外渲染 Pass 提供者（上层扩展包接入点，如 `@feng3d/ui` 的 UI pass）。
 *
 * 编排位置固定：阴影 Pass → 主 Pass → 额外 Pass（按注册顺序）；额外 Pass 的颜色附件是
 * `loadOp: 'load'`，因此画在主场景之上。同名重复注册时后者覆盖前者。
 *
 * @param provider pass 提供者
 */
export function registerViewPass(provider: ViewPassProvider): void
{
    if (!_viewPassProviders) _viewPassProviders = [];

    const index = _viewPassProviders.findIndex((p) => p.name === provider.name);
    if (index >= 0) _viewPassProviders[index] = provider;
    else _viewPassProviders.push(provider);
}

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
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'AudioListener',
            }],
        }, {
            __type__: 'Object3D',
            name: 'DirectionalLight',
            position: { x: 0, y: 3, z: 0 },
            rotation: { x: 50 * Math.PI / 180, y: -30 * Math.PI / 180, z: 0 },
            components: [{
                __type__: 'DirectionalLight',
                shadowType: ShadowType.Hard_Shadows,
            }],
        }],
    };

    // 触发 logic：注册 EntityLogic（组件自动初始化）与 ContainerLogic（子级自动同步 parent）
    getLogic(root);

    return root.components!.find(c => c.__type__ === 'Scene') as Scene;
}