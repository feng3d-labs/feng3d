import { computed, getMutationCount, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
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
 * View 逻辑类。
 *
 * 持有渲染提交链 computed 与帧版本号，仅暴露 submit getter。
 * submit getter 内部调用 update（同步 canvas/更新场景）后返回 submitComputed.value。
 *
 * scene/camera 从 view.root 响应式派生（computed），root 变化时自动重算。
 * 渲染对象列表由各 renderer 的 computed 求值（响应式链自动级联），
 * 失效完全由数据变化驱动（框架设计文档 4.1），静态场景零重算。
 *
 * 使用方式：每帧读 submit getter 驱动渲染链，返回 submit 供 webgpu.submit 提交：
 * ```ts
 * ticker.onframe(() =>
 * {
 *     webgpu.submit(viewLogic.submit);
 * });
 * ```
 */
export class ViewLogic
{
    /** 数据引用 */
    readonly #view: View;

    // 触发 logic：注册 EntityLogic（组件自动初始化）与 ContainerLogic（子级自动同步 parent）
    readonly #skyboxObjects: ReturnType<typeof skyboxRenderObject>;

    // scene：从 root 查找 Scene 组件；缺失则创建默认 Scene 挂到 root.components。
    // 读 r_view.root 建立响应式依赖——root 替换时本 computed 自动重算。
    readonly #sceneComputed = computed(() =>
    {
        let scene = getLogic(toRaw(reactive(this.#view).root)).getComponent<Scene>('Scene');
        if (!scene)
        {
            scene = { __type__: 'Scene' } as Scene;
            reactive(this.#view).root.components.push(scene);
        }

        return scene;
    });

    // camera：从 root 子树查找 Camera；缺失则创建默认 PerspectiveCamera 挂到 root.children。
    // 同样响应式追踪 root，root 变化时重算。
    readonly #cameraComputed = computed(() =>
    {
        const r_view = reactive(this.#view);
        const r_root = r_view.root;   // 响应式读取建立依赖
        let camera = getLogic(toRaw(r_root)).getComponentsInChildren<Camera>('Camera')[0];
        if (!camera)
        {
            const defaultCamObj = { __type__: 'Object3D', name: 'defaultCamera' } as Object3D;
            getLogic(defaultCamObj);
            camera = { __type__: 'PerspectiveCamera' } as Camera;
            reactive(defaultCamObj).components.push(camera);
            r_root.children.push(getLogic(camera).entity as Object3D);
        }

        return camera;
    });

    // ── 响应式渲染链 ──────────────────────────────────────────────
    // 数据（场景树/相机/光源/画布尺寸）→ 各 renderer computed → renderPassObjects → submit
    // 变更驱动失效（框架设计文档 4.1）：无每帧全局失效源，静态场景零重算。
    // ─────────────────────────────────────────────────────────────

    // 画布尺寸（响应式源，每帧 render 同步 canvas.clientWidth/Height）
    readonly #canvaSize: { readonly width: number, readonly height: number } = { width: 1, height: 1 };

    readonly #renderPass: RenderPass = { descriptor: null, renderPassObjects: [] };

    #descriptor: RenderPassDescriptor;
    #colorView: TextureView;
    #depthStencilView: TextureView;

    readonly #clearValue = computed(() =>
    {
        const bg = reactive(this.#sceneComputed.value).background ?? { r: 0, g: 0, b: 0, a: 1 };

        return [bg.r, bg.g, bg.b, bg.a] as Color;
    });

    readonly #size: TextureSize = [1, 1];
    #depthTexture: Texture;

    readonly #depthTextureComputed = computed(() =>
    {
        // 读 reactive 代理建立依赖（canvaSize.width 变化时本 computed 失效）
        const r_canvaSize = reactive(this.#canvaSize);
        reactive(this.#size)[0] = r_canvaSize.width;
        reactive(this.#size)[1] = r_canvaSize.height;

        return this.#depthTexture;
    });

    // 画布像素尺寸（响应式，canvaSize 变化时失效），供需要屏幕空间尺寸的着色器使用
    // （如 PointMaterial billboard 按像素展开方形点）。ForwardRenderer 注入 globalUniforms.u_Viewport。
    readonly #viewportComputed = computed<readonly [number, number]>(() =>
    {
        const r_canvaSize = reactive(this.#canvaSize);

        return [r_canvaSize.width, r_canvaSize.height];
    });

    readonly #context: CanvasContext = { canvasId: null };
    #canvasTexture: CanvasTexture;

    readonly #canvasTextureComputed = computed(() =>
    {
        reactive(this.#view).canvas;

        reactive(this.#context).canvasId = this.#resolveCanvas();

        return this.#canvasTexture;
    });

    readonly #canvasRenderPassDescriptorComputed = computed(() =>
    {
        if (!this.#descriptor)
        {
            this.#descriptor = {
                colorAttachments: [
                    {
                        view: this.#colorView = { texture: null },
                        clearValue: [0, 0, 0, 1],
                    },
                ],
                depthStencilAttachment: {
                    view: this.#depthStencilView = { texture: null },
                    depthClearValue: 1,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
        }

        reactive(this.#depthStencilView).texture = this.#depthTextureComputed.value;
        reactive(this.#colorView).texture = this.#canvasTextureComputed.value;
        reactive(this.#descriptor.colorAttachments[0]).clearValue = this.#clearValue.value;

        return this.#descriptor;
    });

    readonly #canvasRenderPassComputed = computed(() =>
    {
        reactive(this.#renderPass).descriptor = this.#canvasRenderPassDescriptorComputed.value;

        // 接入各 renderer 响应式链：
        // 数据变化 → 各 draw computed 失效 → 返回新 RenderObject[]
        // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
        //
        // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
        const skyboxObject = this.#skyboxObjects.renderObject;
        const forwardObjects = forwardRenderer.draw(this.#sceneComputed.value, this.#cameraComputed.value, this.#viewportComputed).value;
        const outlineObjects = outlineRenderer.draw(this.#sceneComputed.value, this.#cameraComputed.value).value;
        const wireframeObjects = wireframeRenderer.draw(this.#sceneComputed.value, this.#cameraComputed.value).value;
        reactive(this.#renderPass).renderPassObjects = [
            ...(skyboxObject ? [skyboxObject] : []),
            ...forwardObjects,
            ...outlineObjects,
            ...wireframeObjects,
        ];

        return this.#renderPass;
    });

    readonly #passEncoders: PassEncoder[] = [];
    readonly #submit: Submit;

    readonly #submitComputed = computed(() =>
    {
        // 接入 ShadowRenderer 响应式链：
        // 光源/渲染对象变化 → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
        //
        // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
        // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
        const shadowPasses = shadowRenderer.draw(this.#sceneComputed.value, this.#cameraComputed.value).value;
        for (let i = 0; i < shadowPasses.length; i++)
        {
            this.#passEncoders[i] = shadowPasses[i];
        }
        // 主 Pass 固定排在阴影 Pass 之后
        this.#passEncoders[shadowPasses.length] = this.#canvasRenderPassComputed.value;
        // 截断多余元素（光源减少时旧 Pass 不再执行）
        this.#passEncoders.length = shadowPasses.length + 1;

        return this.#submit;
    });

    /** 上次有效提交（错误处理降级用，设计文档 8.1：prod 下 submit 计算失败时保持上一帧） */
    #lastValidSubmit: Submit | undefined;

    protected constructor(view: View)
    {
        this.#view = view;

        // 资源包装实例（构造期一次性创建，computed 懒引用）
        this.#depthTexture = { descriptor: { size: this.#size, format: 'depth24plus' } };
        this.#canvasTexture = { context: this.#context };
        this.#submit = { commandEncoders: [{ passEncoders: this.#passEncoders }] };

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
        const self = this;
        this.#skyboxObjects = skyboxRenderObject({
            get scene() { return self.#sceneComputed.value; },
            get camera() { return self.#cameraComputed.value; },
        });
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(view: View): ViewLogic
    {
        return new ViewLogic(view);
    }

    /** 宿主锚点解析（设计文档 3.3）：字符串按元素 id 解析为 HTMLCanvasElement */
    #resolveCanvas(): HTMLCanvasElement
    {
        const c = toRaw(reactive(this.#view).canvas);

        return typeof c === 'string' ? document.getElementById(c) as HTMLCanvasElement : c;
    }

    /**
     * 更新场景（内部方法，由 submit getter 调用）。
     *
     * 同步 canvas 尺寸、同步相机 aspect、驱动场景 Behaviour update。
     * 渲染链失效完全由数据变化驱动（无每帧全局失效源）。
     */
    #update(): void
    {
        const scene = this.#sceneComputed.value;
        if (!scene) return;

        getLogic(scene).update();

        const canvas = this.#resolveCanvas();
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        reactive(this.#canvaSize).width = canvas.width || canvas.clientWidth || 1;
        reactive(this.#canvaSize).height = canvas.height || canvas.clientHeight || 1;

        // 自动同步相机 aspect 与画布宽高比（PerspectiveCamera 才有 aspect 字段）。
        // 避免画布尺寸变化时投影矩阵 aspect 滞后导致立方体被拉伸为长方体。
        const camera = this.#cameraComputed.value as Camera & { aspect?: number };
        const h = canvas.height || canvas.clientHeight || 1;
        if (camera && 'aspect' in camera)
        {
            reactive(camera).aspect = (canvas.width || canvas.clientWidth || 1) / h;
        }
    }

    /**
     * 渲染提交对象（每帧读取驱动整个渲染链）。
     *
     * 读取本 getter 时内部会同步 canvas 尺寸、更新场景，然后求值响应式渲染链
     * （阴影 Pass + 主 Pass），返回 submit 供 webgpu.submit 提交。
     */
    get submit(): Submit
    {
        this.#update();

        let s: Submit;
        try
        {
            s = this.#submitComputed.value;
        }
        catch (e)
        {
            // 拉取模型的优势：异常收敛到唯一的消费入口（设计文档 8.1）
            if ((globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production' && this.#lastValidSubmit)
            {
                console.error('[View] submit 计算失败，保持上次提交：', e);
                s = this.#lastValidSubmit;
            }
            else
            {
                throw e;
            }
        }
        this.#lastValidSubmit = s;

        // 按需呈现（框架设计文档 4.2）：以全局变更计数为版本号。
        // update/求值期间的数据写入（脚本、响应式失效级联）都已完成，
        // 此处打戳；webgpu.submit 对比版本相同则跳过编码与提交。
        // 非响应式内容源（视频纹理等）需调用 markMutation() 显式标记。
        (s as { version?: number }).version = getMutationCount();

        return s;
    }
}

// 注册到 logic 分发表
registerLogic('View', ViewLogic as unknown as new (data: View) => ViewLogic);

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

    return root.components.find(c => c.__type__ === 'Scene') as Scene;
}
