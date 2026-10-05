import { ErrorCode, reportDegradation } from './CodedError';
import { computed, createLogicProto, getMutationCount, logic as getLogic, reactive, registerLogic, toRaw, type Computed } from '@feng3d/reactivity';
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
 * 实例由 `Object.create(viewLogicProto)` 创建，方法 / getter 挂在文件级共享 proto 上
 * （千级对象场景不产生每实例闭包）；原 class 的 `#field` 状态落在实例字段上
 * （`_` 前缀），见 {@link ViewLogicState}。
 */
export interface ViewLogic
{
    /**
     * 场景（`root` 上的 Scene 组件；缺失时就地创建默认 Scene 并挂到 `root.components`）。
     *
     * 只读 getter（规范 §11.2）：与渲染链读的是同一个 `_sceneComputed`，
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

/** View 系 Logic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface ViewLogicState
{
    /** 数据引用 */
    _view: View;

    /** skybox 渲染对象（构造期创建，computed 懒引用） */
    _skyboxObjects: ReturnType<typeof skyboxRenderObject>;

    /** 场景（响应式 computed，从 root 查找 Scene 组件） */
    _sceneComputed: Computed<Scene>;

    /** 相机（响应式 computed，从 root 子树查找 Camera） */
    _cameraComputed: Computed<Camera>;

    /** 画布尺寸（响应式源，每帧 render 同步 canvas.clientWidth/Height） */
    _canvaSize: { readonly width: number; readonly height: number };

    /** 主渲染 Pass 占位（descriptor 由 _canvasRenderPassDescriptorComputed 填充） */
    _renderPass: RenderPass;

    /** 主渲染 Pass descriptor（懒创建） */
    _descriptor: RenderPassDescriptor;

    /** 颜色附件视图（懒创建） */
    _colorView: TextureView;

    /** 深度模板附件视图（懒创建） */
    _depthStencilView: TextureView;

    /** 清屏色（响应式 computed，读场景 background） */
    _clearValue: Computed<Color>;

    /** 画布纹理尺寸（响应式源） */
    _size: TextureSize;

    /** 深度纹理（构造期创建） */
    _depthTexture: Texture;

    /** 深度纹理（响应式 computed，size 变化时重算） */
    _depthTextureComputed: Computed<Texture>;

    /** 画布像素尺寸（响应式 computed，供需要屏幕空间尺寸的着色器使用） */
    _viewportComputed: Computed<readonly [number, number]>;

    /** 画布上下文（响应式源） */
    _context: CanvasContext;

    /** 画布纹理（构造期创建） */
    _canvasTexture: CanvasTexture;

    /** 画布纹理（响应式 computed，canvasId 变化时重算） */
    _canvasTextureComputed: Computed<CanvasTexture>;

    /** 主渲染 Pass descriptor（响应式 computed） */
    _canvasRenderPassDescriptorComputed: Computed<RenderPassDescriptor>;

    /** 主渲染 Pass（响应式 computed，接入各 renderer 渲染链） */
    _canvasRenderPassComputed: Computed<RenderPass>;

    /** 各 Pass 编码器（阴影 Pass 在前、主 Pass 在后） */
    _passEncoders: PassEncoder[];

    /** 提交对象（构造期创建） */
    _submit: Submit;

    /** 提交链（响应式 computed，接入 ShadowRenderer 渲染链） */
    _submitComputed: Computed<Submit>;

    /** 上次有效提交（错误处理降级用，设计文档 8.1：prod 下 submit 计算失败时保持上一帧） */
    _lastValidSubmit: Submit | undefined;
}

/** ViewLogic 的共享原型（issue #674）：独立根（无 Logic 父类），基传 null */
const viewLogicProto = createLogicProto<ViewLogic>(null, {
    /** 场景（root 上的 Scene 组件，缺失时就地创建） */
    scene: {
        get: function (this: ViewLogic & ViewLogicState): Scene { return this._sceneComputed.value; },
    },
    /** 宿主画布元素（view.canvas 为字符串时按元素 id 解析） */
    canvasElement: {
        get: function (this: ViewLogic & ViewLogicState): HTMLCanvasElement { return resolveCanvas(this); },
    },
    /** 渲染提交对象（每帧读取驱动整个渲染链） */
    submit: {
        get: function (this: ViewLogic & ViewLogicState): Submit
        {
            updateView(this);

            let s: Submit;
            try
            {
                s = this._submitComputed.value;
            }
            catch (e)
            {
                // 拉取模型的优势：异常收敛到唯一的消费入口（设计文档 8.1）
                if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production' && this._lastValidSubmit)
                {
                    reportDegradation(ErrorCode.SubmitComputeFailed, { error: e });
                    s = this._lastValidSubmit;
                }
                else
                {
                    // dev：附数据上下文定位（设计 8.1「哪个节点」的 v1 形态——完整依赖链
                    // 摘要待第 9 章 devtools 计算图可视化）。求值链顶层节点 = root/scene/camera。
                    reportDegradation(ErrorCode.SubmitEvaluateFailed, {
                        canvas: typeof this._view.canvas === 'string' ? `#${this._view.canvas}` : '(element)',
                        root: this._view.root?.name ?? '(未命名)',
                        scene: this._view.root?.components?.find(c => (c as { __type__?: string }).__type__ === 'Scene') ? 'Scene 组件' : '(未找到)',
                        camera: this._cameraComputed.value ? (this._cameraComputed.value as { __type__: string }).__type__ : '(未解析)',
                    });
                    throw e;
                }
            }
            this._lastValidSubmit = s;

            // 按需呈现（框架设计文档 4.2）：以全局变更计数为版本号。
            // update/求值期间的数据写入（脚本、响应式失效级联）都已完成，
            // 此处打戳；webgpu.submit 对比版本相同则跳过编码与提交。
            // 非响应式内容源（视频纹理等）需调用 markMutation() 显式标记。
            (s as { version?: number }).version = getMutationCount();

            return s;
        },
    },
});

/** 宿主锚点解析（设计文档 3.3）：字符串按元素 id 解析为 HTMLCanvasElement */
function resolveCanvas(logic: ViewLogic & ViewLogicState): HTMLCanvasElement
{
    const c = toRaw(reactive(logic._view).canvas);

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
function updateView(logic: ViewLogic & ViewLogicState): void
{
    const scene = logic._sceneComputed.value;
    if (!scene) return;

    getLogic(scene).update();

    const canvas = resolveCanvas(logic);
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

    reactive(logic._canvaSize).width = canvas.width || canvas.clientWidth || 1;
    reactive(logic._canvaSize).height = canvas.height || canvas.clientHeight || 1;

    // 自动同步相机 aspect 与画布宽高比（PerspectiveCamera 才有 aspect 字段）。
    // 避免画布尺寸变化时投影矩阵 aspect 滞后导致立方体被拉伸为长方体。
    const camera = logic._cameraComputed.value as Camera & { aspect?: number };
    const h = canvas.height || canvas.clientHeight || 1;
    if (camera && 'aspect' in camera)
    {
        reactive(camera).aspect = (canvas.width || canvas.clientWidth || 1) / h;
    }
}

/**
 * 工厂函数：ViewLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 独立根（无 Logic 父类）：实例装配自己的全部内部状态。原 class 的实例字段初始化
 * 与构造函数体按原声明顺序逐条搬入。
 *
 * @param view 视图数据（raw）
 */
export function viewLogic(view: View): ViewLogic
{
    const logic = Object.create(viewLogicProto) as ViewLogic & ViewLogicState;

    // ---- 原实例字段初始化（按原声明顺序） ----
    // scene：从 root 查找 Scene 组件；缺失则创建默认 Scene 挂到 root.components。
    // 读 r_view.root 建立响应式依赖——root 替换时本 computed 自动重算。
    logic._sceneComputed = computed(() =>
    {
        let scene = getLogic(toRaw(reactive(logic._view).root)).getComponent<Scene>('Scene');
        if (!scene)
        {
            scene = { __type__: 'Scene' } as Scene;
            reactive(logic._view).root.components!.push(scene);
        }

        return scene;
    });

    // camera：从 root 子树查找 Camera；缺失则创建默认 PerspectiveCamera 挂到 root.children。
    // 同样响应式追踪 root，root 变化时重算。
    logic._cameraComputed = computed(() =>
    {
        const r_view = reactive(logic._view);
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
    logic._canvaSize = { width: 1, height: 1 };

    // 初始占位：descriptor 由 _canvasRenderPassDescriptorComputed 填充（strictNullChecks 下按占位语义断言）
    logic._renderPass = { descriptor: null as unknown as RenderPassDescriptor, renderPassObjects: [] };

    logic._clearValue = computed(() =>
    {
        const bg = reactive(logic._sceneComputed.value).background ?? { r: 0, g: 0, b: 0, a: 1 };

        return [bg.r, bg.g, bg.b, bg.a] as Color;
    });

    logic._size = [1, 1];

    logic._depthTextureComputed = computed(() =>
    {
        // 读 reactive 代理建立依赖（canvaSize.width 变化时本 computed 失效）
        const r_canvaSize = reactive(logic._canvaSize);
        reactive(logic._size)[0] = r_canvaSize.width;
        reactive(logic._size)[1] = r_canvaSize.height;

        return logic._depthTexture;
    });

    // 画布像素尺寸（响应式，canvaSize 变化时失效），供需要屏幕空间尺寸的着色器使用
    // （如 PointMaterial billboard 按像素展开方形点）。ForwardRenderer 注入 globalUniforms.u_Viewport。
    logic._viewportComputed = computed<readonly [number, number]>(() =>
    {
        const r_canvaSize = reactive(logic._canvaSize);

        return [r_canvaSize.width, r_canvaSize.height];
    });

    logic._context = { canvasId: null as unknown as CanvasContext['canvasId'] };

    logic._canvasTextureComputed = computed(() =>
    {
        reactive(logic._view).canvas;

        reactive(logic._context).canvasId = resolveCanvas(logic);

        return logic._canvasTexture;
    });

    logic._canvasRenderPassDescriptorComputed = computed(() =>
    {
        if (!logic._descriptor)
        {
            logic._descriptor = {
                colorAttachments: [
                    {
                        view: logic._colorView = { texture: null as unknown as TextureView['texture'] },
                        clearValue: [0, 0, 0, 1],
                    },
                ],
                depthStencilAttachment: {
                    view: logic._depthStencilView = { texture: null as unknown as TextureView['texture'] },
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
        }

        reactive(logic._depthStencilView).texture = logic._depthTextureComputed.value;
        reactive(logic._colorView).texture = logic._canvasTextureComputed.value;
        reactive(logic._descriptor.colorAttachments![0]!).clearValue = logic._clearValue.value;

        return logic._descriptor;
    });

    logic._canvasRenderPassComputed = computed(() =>
    {
        reactive(logic._renderPass).descriptor = logic._canvasRenderPassDescriptorComputed.value;

        // 接入各 renderer 响应式链：
        // 数据变化 → 各 draw computed 失效 → 返回新 RenderObject[]
        // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
        //
        // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
        const skyboxObject = logic._skyboxObjects.renderObject;
        const forwardObjects = forwardRenderer.draw(logic._sceneComputed.value, logic._cameraComputed.value, logic._viewportComputed).value;
        const outlineObjects = outlineRenderer.draw(logic._sceneComputed.value, logic._cameraComputed.value).value;
        const wireframeObjects = wireframeRenderer.draw(logic._sceneComputed.value, logic._cameraComputed.value).value;
        reactive(logic._renderPass).renderPassObjects = [
            ...(skyboxObject ? [skyboxObject] : []),
            ...forwardObjects,
            ...outlineObjects,
            ...wireframeObjects,
        ];

        return logic._renderPass;
    });

    logic._passEncoders = [];

    logic._submitComputed = computed(() =>
    {
        // 接入 ShadowRenderer 响应式链：
        // 光源/渲染对象变化 → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
        //
        // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
        // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
        const shadowPasses = shadowRenderer.draw(logic._sceneComputed.value, logic._cameraComputed.value).value;
        for (let i = 0; i < shadowPasses.length; i++)
        {
            logic._passEncoders[i] = shadowPasses[i];
        }
        // 主 Pass 固定排在阴影 Pass 之后
        logic._passEncoders[shadowPasses.length] = logic._canvasRenderPassComputed.value;
        // 截断多余元素（光源减少时旧 Pass 不再执行）
        logic._passEncoders.length = shadowPasses.length + 1;

        return logic._submit;
    });

    // ---- 原构造函数体 ----
    logic._view = view;

    // 资源包装实例（构造期一次性创建，computed 懒引用）
    logic._depthTexture = { descriptor: { size: logic._size, format: 'depth24plus' } };
    logic._canvasTexture = { context: logic._context };
    logic._submit = { commandEncoders: [{ passEncoders: logic._passEncoders }] };

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
    logic._skyboxObjects = skyboxRenderObject({
        get scene() { return logic._sceneComputed.value; },
        get camera() { return logic._cameraComputed.value; },
    });

    return logic;
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
