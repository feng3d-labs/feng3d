import { Matrix4x4, Vector3 } from '@feng3d/math';
import { computed, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { Components } from '../component/Component';
import type { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { applyPrefab } from './Prefab';
import { resolveRefs } from './Ref';
import { Container, ContainerLogic, setParent } from './Container';

/**
 * 游戏对象，场景唯一存在的对象类型
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Object3D' }` 字面量创建实例。
 * 所有行为逻辑（组件管理、层级管理、激活状态、包围盒等）由 {@link Object3DLogic} 提供。
 *
 * 原始游戏对象创建等工厂方法以独立函数形式提供：{@link findObject3DChild}。
 */
export interface Object3D extends Container<Object3D>
{
    __type__: 'Object3D';

    /**
     * 名称（缺失时由 Object3DLogic 提供默认值）
     */
    readonly name?: string;

    /**
     * The tag of this game object.（缺失时由 Object3DLogic 提供默认值）
     */
    readonly tag?: string;

    /**
     * 自身以及子对象是否支持鼠标拾取（缺失时由 Object3DLogic 提供默认值）
     */
    readonly mouseEnabled?: boolean;

    /**
     * The local active state of this Object3D.（缺失时由 Object3DLogic 提供默认值）
     *
     * 通过 reactive(this).activeSelf = value 修改。
     */
    readonly activeSelf?: boolean;

    /**
     * 资源类型（缺失时由 Object3DLogic 提供默认值）
     */
    readonly assetType?: string;

    /**
     * 资源编号（缺失时由 Object3DLogic 提供默认值）
     */
    readonly assetId?: string;

    /**
     * Prefab 模板编号（框架设计文档 3.6）。
     *
     * 引用 `View.defs.prefabs` 中的模板；logic() 首次触达该节点时实例化
     * （深拷贝模板 + 递归合并 {@link Object3D.overrides}）。
     */
    readonly prefabId?: string;

    /**
     * Prefab 实例差异覆盖（框架设计文档 3.6）。
     *
     * 构造期与模板深拷贝递归合并：对象字段递归合并，数组与原始值整体覆盖；
     * 实例化后保留在节点上（序列化可还原）。
     */
    readonly overrides?: Record<string, unknown>;

    /**
     * 本地位移（缺失时由 Object3DLogic 提供默认值）
     */
    readonly position?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地旋转（弧度，缺失时由 Object3DLogic 提供默认值）。
     *
     * xyz 为绕各坐标轴的欧拉角，单位弧度，与 three.js Object3D.rotation 约定一致。
     */
    readonly rotation?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地缩放（缺失时由 Object3DLogic 提供默认值）
     */
    readonly scale?: { readonly x: number; readonly y: number; readonly z: number };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Object3D: Object3DLogic;
    }
}

export interface TransformUniforms
{
    /**
     * 模型矩阵
     */
    u_modelMatrix?: Matrix4x4;

    /**
     * 模型逆转置矩阵,用于计算全局法线
     * 参考：http://blog.csdn.net/christina123y/article/details/5963679
     */
    u_ITModelMatrix?: Matrix4x4;
}

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        transform?: BufferBinding<TransformUniforms>;
    }
}

/**
 * Object3D 逻辑类。
 *
 * 继承 {@link ContainerLogic}（进而继承 EntityLogic），复用全部 Entity + Container 行为：
 * entity / components / children / parent（只读 getter）/ getComponent / getComponents。
 *
 * 本类仅实现 Object3D 特有行为（变换矩阵、scene、激活状态、包围盒、beforeRender/lookAt/dispose）。
 *
 * 通过 `logic(object3D)` 获取实例（registerLogic 注册了 Object3DLogic）。
 * raw 数据保持干净（缺失字段不被写入，序列化不含默认值）。
 */
export class Object3DLogic extends ContainerLogic
{
    // ---- 默认值（实例私有，提供稳定引用供响应式追踪） ----
    readonly #_defaultPosition = { x: 0, y: 0, z: 0 };
    readonly #_defaultRotation = { x: 0, y: 0, z: 0 };
    readonly #_defaultScale = { x: 1, y: 1, z: 1 };

    // ---- 字段 computed（默认值） ----
    // 缺省字段不写回 raw（保持序列化干净），仅在 computed 内用字面量回退默认值。
    readonly #_name = computed(() => reactive(this._data as Object3D).name ?? 'Object3D');
    readonly #_mouseEnabled = computed(() => reactive(this._data as Object3D).mouseEnabled ?? true);
    readonly #_activeSelf = computed(() => reactive(this._data as Object3D).activeSelf ?? true);
    readonly #_position = computed(() => reactive(this._data as Object3D).position ?? this.#_defaultPosition);
    readonly #_rotation = computed(() => reactive(this._data as Object3D).rotation ?? this.#_defaultRotation);
    readonly #_scale = computed(() => reactive(this._data as Object3D).scale ?? this.#_defaultScale);

    readonly #_scene = computed<Scene | null>(() =>
    {
        const sceneComponent = this.getComponent<Scene>('Scene');
        if (sceneComponent) return sceneComponent;
        const parent = this.parent;

        return parent ? getLogic(parent as Object3D).scene : null;
    });

    readonly #_activeInHierarchy = computed<boolean>(() =>
    {
        let active = this.#_activeSelf.value;
        const parent = this.parent;
        if (parent)
        {
            active = active && getLogic(parent as Object3D).activeInHierarchy;
        }

        return active;
    });

    readonly #_boundingBox = computed<BoundingBox>(() => new BoundingBox(this._data as Object3D));

    readonly #_matrix = computed<Matrix4x4>(() =>
    {
        const p = this.#_position.value;
        const r = this.#_rotation.value;
        const s = this.#_scale.value;

        return new Matrix4x4().fromTRS(
            new Vector3(p.x, p.y, p.z),
            new Vector3(r.x, r.y, r.z),
            new Vector3(s.x, s.y, s.z));
    });

    readonly #_rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r = this.#_rotation.value;

        return new Matrix4x4().setRotation(new Vector3(r.x, r.y, r.z));
    });

    readonly #_local2world = computed<Matrix4x4>(() =>
    {
        const r_parent = this.parent;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;

            return this.#_matrix.value.clone().append(getLogic(parent).local2world);
        }

        return this.#_matrix.value.clone();
    });

    readonly #_ITlocal2world = computed<Matrix4x4>(() =>
        this.#_local2world.value.clone().invert().transpose());

    readonly #_world2local = computed<Matrix4x4>(() =>
        this.#_local2world.value.clone().invert());

    readonly #_local2worldRotation = computed<Matrix4x4>(() =>
    {
        const m = this.#_rotationMatrix.value.clone();
        const r_parent = this.parent;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;
            m.append(getLogic(parent).local2worldRotation);
        }

        return m;
    });

    readonly #_world2localRotation = computed<Matrix4x4>(() => this.#_local2worldRotation.value.clone().invert());
    readonly #_worldPosition = computed<Vector3>(() => this.#_local2world.value.getPosition());

    readonly #_isSelfLoaded = computed<boolean>(() =>
    {
        // 通用组件加载状态（ComponentLogic.isLoaded，基类恒 true）：
        // 不探测具体组件类型——含异步资源的组件自行覆盖 isLoaded
        const comps = this.components;
        for (let i = 0; i < comps.length; i++)
        {
            if (!getLogic(comps[i]).isLoaded) return false;
        }

        return true;
    });

    readonly #_isLoaded = computed<boolean>(() =>
    {
        if (!this.#_isSelfLoaded.value) return false;
        const kids = this.children;
        for (let i = 0; i < kids.length; i++)
        {
            if (!getLogic(kids[i]).isLoaded) return false;
        }

        return true;
    });

    // ---- transform uniform 稳定 binding 实例（与 material_uniforms 模式同构）----
    // 整个 Logic 生命周期只创建一次 wrapper；所有消费点（主 Pass / 阴影 Pass 的
    // renderObject.bindingResources.transform）共享同一实例——WGPUBufferBinding
    // 按 [device, binding, type] 缓存，共享使每对象只占一个 transform GPUBuffer。
    // 构造时求值一次 local2world（首帧本就需要），之后仅在 beforeRender 消费点
    // 做字段级更新（不替换 .value 对象，失效粒度最小）。
    readonly #_transformBinding: BufferBinding<TransformUniforms> = { value: {} as TransformUniforms };

    protected constructor(data: Object3D)
    {
        // Prefab 实例化（设计 3.6）：prefabId + overrides → 深拷贝模板 + 递归合并 overrides
        // （构造期、非响应式；模板不进运行时响应式追踪）。必须在 super() 前执行：
        // super 构造器注册组件自动初始化 effect，需看到最终的 components/children。
        applyPrefab(data);
        // $ref 共享引用解析（设计 3.7）：{ $ref: 'x' } → 注册表中的同一 raw 对象
        resolveRefs(data);

        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Object3D): Object3DLogic
    {
        return new Object3DLogic(data);
    }

    /** 子对象列表（收窄为 Object3D[]） */
    override get children(): Object3D[]
    {
        return super.children as Object3D[];
    }

    /** 父级容器（只读 getter，收窄为 Object3D | null） */
    override get parent(): Object3D | null
    {
        return super.parent as Object3D | null;
    }

    /** 名称（缺失时返回默认 'Object3D'） */
    get name(): string
    {
        return this.#_name.value;
    }

    /** 是否支持鼠标拾取（缺失时返回默认 true） */
    get mouseEnabled(): boolean
    {
        return this.#_mouseEnabled.value;
    }

    /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
    get scene(): Scene | null
    {
        return this.#_scene.value;
    }

    /** 自身激活状态（缺失时返回默认 true） */
    get activeSelf(): boolean
    {
        return this.#_activeSelf.value;
    }

    /** 自身+祖先 activeSelf AND */
    get activeInHierarchy(): boolean
    {
        return this.#_activeInHierarchy.value;
    }

    /** 轴对齐包围盒（含子对象） */
    get boundingBox(): BoundingBox
    {
        return this.#_boundingBox.value;
    }

    /** 本地位移（缺失时返回默认 {0,0,0}） */
    get position(): { x: number; y: number; z: number }
    {
        return this.#_position.value;
    }

    /** 本地旋转（弧度，缺失时返回默认 {0,0,0}） */
    get rotation(): { x: number; y: number; z: number }
    {
        return this.#_rotation.value;
    }

    /** 本地缩放（缺失时返回默认 {1,1,1}） */
    get scale(): { x: number; y: number; z: number }
    {
        return this.#_scale.value;
    }

    /** 本地变换矩阵（由 position/rotation/scale 计算） */
    get matrix(): Matrix4x4
    {
        return this.#_matrix.value;
    }

    /** 本地转世界矩阵（含 parent 链） */
    get local2world(): Matrix4x4
    {
        return this.#_local2world.value;
    }

    /** 本地转世界逆转置矩阵 */
    get ITlocal2world(): Matrix4x4
    {
        return this.#_ITlocal2world.value;
    }

    /** 世界转本地矩阵 */
    get world2local(): Matrix4x4
    {
        return this.#_world2local.value;
    }

    /** 本地转世界旋转矩阵（含 parent 链） */
    get local2worldRotation(): Matrix4x4
    {
        return this.#_local2worldRotation.value;
    }

    /** 世界转本地旋转矩阵 */
    get world2localRotation(): Matrix4x4
    {
        return this.#_world2localRotation.value;
    }

    /** 世界坐标 */
    get worldPosition(): Vector3
    {
        return this.#_worldPosition.value;
    }

    /** 自身+子孙是否加载完成 */
    get isLoaded(): boolean
    {
        return this.#_isLoaded.value;
    }

    /**
     * transform uniform 的稳定 binding 实例（模型矩阵 + 逆转置矩阵）。
     *
     * 整个 Logic 生命周期同一引用，供主 Pass / 阴影 Pass 的
     * renderObject.bindingResources.transform 共享（每对象一个 transform GPUBuffer）。
     */
    get transformUniforms(): BufferBinding<TransformUniforms>
    {
        return this.#_transformBinding;
    }

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject): void
    {
        // 初始化 bindingResources（缺失时创建）
        const r_renderObject = reactive(renderObject);
        if (!renderObject.bindingResources) r_renderObject.bindingResources = {};
        const bindingResources = renderObject.bindingResources;
        bindingResources.transform ||= this.#_transformBinding;
        const r_transformUniforms = reactive(this.#_transformBinding.value);
        r_transformUniforms.u_modelMatrix = this.#_local2world.value;
        r_transformUniforms.u_ITModelMatrix = this.#_ITlocal2world.value;
    }

    /** 让物体看向目标点（仅修改 rotation 数据） */
    lookAt(target: Vector3, upAxis?: Vector3): void
    {
        const m = this.#_matrix.value.clone();
        m.lookAt(target, upAxis);
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        // 写入完整 rotation 对象（toTRS 返回弧度，raw.rotation 缺失时整体赋值，避免子字段修改崩溃）
        reactive(this._data as Object3D).rotation = { x: rot.x, y: rot.y, z: rot.z };
    }

    /** 释放：从父级移除、递归 dispose 子对象与组件 */
    dispose(): void
    {
        const parent = this.parent;
        if (parent)
        {
            const parentChildren = reactive(parent).children as unknown as Object3D[];
            parentChildren.splice(parentChildren.indexOf(this._data as Object3D), 1);
        }
        setParent(this, null);
        const kids = this.children;
        for (let i = kids.length - 1; i >= 0; i--)
        {
            getLogic(kids[i]).dispose();
        }
        const r_components = reactive(this._data as Object3D).components as Components[];
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Components;
            r_components.splice(i, 1);
            getLogic(component).dispose();
        }
    }
}

// 注册到统一 logic 分发表
registerLogic('Object3D', Object3DLogic as unknown as new (data: Object3D) => Object3DLogic);

export function findObject3DChild(object3D: Object3D, name: string): Object3D | undefined
{
    const object3DLogic = getLogic(object3D);
    const children = object3DLogic.children;
    for (let i = 0; i < children.length; i++)
    {
        const child = children[i];
        if (getLogic(child).name === name) return child;
    }
    for (let i = 0; i < children.length; i++)
    {
        const found = findObject3DChild(children[i], name);
        if (found) return found;
    }

    return undefined;
}

/**
 * TransformUniforms WGSL 片段（struct + binding 声明）。
 *
 * 与 Object3DLogic.beforeRender 写入的 bindingResources.transform 对应：
 * - @group(0) @binding(0) u_modelMatrix / u_ITModelMatrix 由 local2world / ITlocal2world 填充。
 *
 * 各材质顶点着色器通过字符串拼接复用本片段，避免 struct 重复声明。
 */
export const transformUniformsWGSL = `
struct TransformUniforms {
    u_modelMatrix: mat4x4<f32>,
    u_ITModelMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> transform: TransformUniforms;
`;
