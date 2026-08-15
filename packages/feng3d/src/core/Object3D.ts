import { Matrix4x4, Vector3 } from '@feng3d/math';
import { computed, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { Components, TransformSamplingLogic } from '../component/Component';
import type { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { applyPrefab } from './Prefab';
import { resolveRefs } from './Ref';
import { Container, containerLogic, ContainerLogic, setParent } from './Container';

/**
 * 游戏对象，场景唯一存在的对象类型
 *
 * 纯数据接口：仅声明 readonly 属性，由 `{ __type__: 'Object3D' }` 字面量创建实例。
 * 所有行为逻辑（组件管理、层级管理、激活状态、包围盒等）由 {@link object3DLogic} 提供。
 *
 * 原始游戏对象创建等工厂方法以独立函数形式提供：{@link findObject3DChild}。
 */
export interface Object3D extends Container<Object3D>
{
    __type__: 'Object3D';

    /**
     * 名称（缺失时由 registerLogic 自动填充）
     */
    readonly name?: string;

    /**
     * The tag of this game object.（缺失时由 registerLogic 自动填充）
     */
    readonly tag?: string;

    /**
     * 自身以及子对象是否支持鼠标拾取（缺失时由 registerLogic 自动填充）
     */
    readonly mouseEnabled?: boolean;

    /**
     * The local active state of this Object3D.（缺失时由 registerLogic 自动填充）
     *
     * 通过 reactive(this).activeSelf = value 修改。
     */
    readonly activeSelf?: boolean;

    /**
     * 资源类型（缺失时由 registerLogic 自动填充）
     */
    readonly assetType?: string;

    /**
     * 资源编号（缺失时由 registerLogic 自动填充）
     */
    readonly assetId?: string;

    /**
     * 预设资源编号（缺失时由 registerLogic 自动填充）
     */
    readonly prefabId?: string;

    /**
     * 本地位移（缺失时由 registerLogic 自动填充）
     */
    readonly position?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地旋转（弧度，缺失时由 registerLogic 自动填充）。
     *
     * xyz 为绕各坐标轴的欧拉角，单位弧度，与 three.js Object3D.rotation 约定一致。
     */
    readonly rotation?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地缩放（缺失时由 registerLogic 自动填充）
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
 * Object3DLogic 实例接口（由 object3DLogic 工厂函数返回）。
 *
 * 继承 {@link ContainerLogic}（进而继承 {@link EntityLogic}），
 * 表示 object3DLogic 通过组合 containerLogic / entityLogic 复用了全部 Entity + Container 行为：
 * entity / components / children / parent（只读 getter）/ getComponent / getComponents。
 *
 * 本接口仅声明 Object3D 特有字段（变换矩阵、scene、激活状态、包围盒、beforeRender/lookAt/dispose）。
 *
 * 通过 `logic(object3D)` 获取实例（registerLogic 注册了 object3DLogic 工厂）。
 * 显式声明接口以避免 ReturnType 循环引用与 Object.defineProperties 返回 {} 推断。
 */
export interface Object3DLogic extends ContainerLogic
{
    /** 子对象列表（收窄为 Object3D[]） */
    get children(): Object3D[];
    /** 父级容器（只读 getter，收窄为 Object3D | null） */
    get parent(): Object3D | null;

    /** 名称（缺失时返回默认 'Object3D'） */
    get name(): string;
    /** 是否支持鼠标拾取（缺失时返回默认 true） */
    get mouseEnabled(): boolean;

    /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
    get scene(): Scene | null;
    /** 自身激活状态（缺失时返回默认 true） */
    get activeSelf(): boolean;
    /** 自身+祖先 activeSelf AND */
    get activeInHierarchy(): boolean;
    /** 轴对齐包围盒（含子对象） */
    get boundingBox(): BoundingBox;

    /** 本地位移（缺失时返回默认 {0,0,0}） */
    get position(): { x: number; y: number; z: number };
    /** 本地旋转（弧度，缺失时返回默认 {0,0,0}） */
    get rotation(): { x: number; y: number; z: number };
    /** 本地缩放（缺失时返回默认 {1,1,1}） */
    get scale(): { x: number; y: number; z: number };

    /** 本地变换矩阵（由 position/rotation/scale 计算） */
    get matrix(): Matrix4x4;
    /** 本地转世界矩阵（含 parent 链） */
    get local2world(): Matrix4x4;
    /** 本地转世界逆转置矩阵 */
    get ITlocal2world(): Matrix4x4;
    /** 世界转本地矩阵 */
    get world2local(): Matrix4x4;
    /** 本地转世界旋转矩阵（含 parent 链） */
    get local2worldRotation(): Matrix4x4;
    /** 世界转本地旋转矩阵 */
    get world2localRotation(): Matrix4x4;
    /** 世界坐标 */
    get worldPosition(): Vector3;
    /** 自身+子孙是否加载完成 */
    get isLoaded(): boolean;

    /**
     * transform uniform 的稳定 binding 实例（模型矩阵 + 逆转置矩阵）。
     *
     * 整个 Logic 生命周期同一引用，供主 Pass / 阴影 Pass 的
     * renderObject.bindingResources.transform 共享（每对象一个 transform GPUBuffer）。
     */
    get transformUniforms(): BufferBinding<TransformUniforms>;
    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject): void;
    /** 让物体看向目标点（仅修改 rotation 数据） */
    lookAt(target: Vector3, upAxis?: Vector3): void;
    /** 释放：从父级移除、递归 dispose 子对象与组件 */
    dispose(): void;
}

/**
 * 创建 Object3DLogic 实例（函数式实现）。
 *
 * 通过组合 {@link containerLogic}（进而组合 {@link entityLogic}）复用全部
 * Entity + Container 行为：
 * - Entity 行为（来自 entityLogic）：components pre-fill + 自动初始化 effect + getComponent/getComponents
 * - Container 行为（来自 containerLogic）：children pre-fill + parent 同步 effect + parent 只读 getter
 * - Object3D 行为（本工厂）：默认值 computed 缺省 + scene/transform 矩阵 + beforeRender/lookAt/dispose
 *
 * 通过 registerLogic('Object3D', object3DLogic) 注册，调用方用 `logic(obj)` 获取实例。
 * raw 数据保持干净（缺失字段不被写入，序列化不含默认值）。
 *
 * 返回类型 {@link Object3DLogic} 通过 ReturnType 推导，供外部类型注解使用。
 */
function object3DLogic(object3D: Object3D): Object3DLogic
{
    // Prefab 实例化（设计 3.6）：prefabId + overrides → 深拷贝模板 + 递归合并 overrides
    // （构造期、非响应式；模板不进运行时响应式追踪）
    applyPrefab(object3D);
    // $ref 共享引用解析（设计 3.7）：{ $ref: 'x' } → 注册表中的同一 raw 对象
    resolveRefs(object3D);

    // ---- 组合 Container（含 Entity）全部行为 ----
    // entityLogic：components pre-fill + 自动初始化 effect + getComponent/getComponents
    // containerLogic：children pre-fill + children→parent 同步 effect + parent 只读 getter
    const base = containerLogic(object3D);

    // ---- 默认值（实例私有，提供稳定引用供响应式追踪） ----
    const _defaultPosition = { x: 0, y: 0, z: 0 };
    const _defaultRotation = { x: 0, y: 0, z: 0 };
    const _defaultScale = { x: 1, y: 1, z: 1 };

    // ---- 字段 computed（默认值） ----
    // 缺省字段不写回 raw（保持序列化干净），仅在 computed 内用字面量回退默认值。
    const name = computed(() => reactive(object3D).name ?? 'Object3D');
    const mouseEnabled = computed(() => reactive(object3D).mouseEnabled ?? true);
    const activeSelf = computed(() => reactive(object3D).activeSelf ?? true);
    const position = computed(() => reactive(object3D).position ?? _defaultPosition);
    const rotation = computed(() => reactive(object3D).rotation ?? _defaultRotation);
    const scale = computed(() => reactive(object3D).scale ?? _defaultScale);

    const scene = computed<Scene | null>(() =>
    {
        const sceneComponent = base.getComponent<Scene>('Scene');
        if (sceneComponent) return sceneComponent;
        const parent = base.parent;

        return parent ? getLogic(parent).scene : null;
    });

    const activeInHierarchy = computed<boolean>(() =>
    {
        let active = activeSelf.value;
        const parent = base.parent;
        if (parent)
        {
            active = active && getLogic(parent).activeInHierarchy;
        }

        return active;
    });

    const boundingBox = computed<BoundingBox>(() => new BoundingBox(object3D));

    // 变换采样（设计 4.5 + 依赖倒置）：通用探测组件的 TransformSamplingLogic 能力
    // （声明式 Animation 等组件实现），Object3D 不依赖任何具体组件——
    // 组件知道 Object3D，Object3D 只知道组件基础能力（Component.ts 扩展点）。
    // 采样值激活时替代数据字段（动画值为派生，数据保持干净）；
    // 经 reactive 迭代 components 建立结构依赖。
    const animatedTRS = computed<{ position?: { x: number; y: number; z: number }; rotation?: { x: number; y: number; z: number }; scale?: { x: number; y: number; z: number } } | null>(() =>
    {
        for (const component of reactive(object3D).components ?? [])
        {
            const cl = getLogic(toRaw(component)) as unknown as Partial<TransformSamplingLogic> | null;
            const sample = cl?.sampleTransform;
            if (sample) return sample;
        }

        return null;
    });

    const matrix = computed<Matrix4x4>(() =>
    {
        const sample = animatedTRS.value;
        const p = sample?.position ?? position.value;
        const r = sample?.rotation ?? rotation.value;
        const s = sample?.scale ?? scale.value;

        return new Matrix4x4().fromTRS(
            new Vector3(p.x, p.y, p.z),
            new Vector3(r.x, r.y, r.z),
            new Vector3(s.x, s.y, s.z));
    });

    const rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r = animatedTRS.value?.rotation ?? rotation.value;

        return new Matrix4x4().setRotation(new Vector3(r.x, r.y, r.z));
    });

    const local2world = computed<Matrix4x4>(() =>
    {
        const r_parent = base.parent;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;

            return matrix.value.clone().append(getLogic(parent).local2world);
        }

        return matrix.value.clone();
    });

    const ITlocal2world = computed<Matrix4x4>(() =>
        local2world.value.clone().invert().transpose());

    const world2local = computed<Matrix4x4>(() =>
        local2world.value.clone().invert());

    const local2worldRotation = computed<Matrix4x4>(() =>
    {
        const m = rotationMatrix.value.clone();
        const r_parent = base.parent;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;
            m.append(getLogic(parent).local2worldRotation);
        }

        return m;
    });

    const _world2localRotation = computed<Matrix4x4>(() => local2worldRotation.value.clone().invert());
    const _worldPosition = computed<Vector3>(() => local2world.value.getPosition());

    const _isSelfLoaded = computed<boolean>(() =>
    {
        // 通用组件加载状态（ComponentLogic.isLoaded，基类恒 true）：
        // 不探测具体组件类型——含异步资源的组件自行覆盖 isLoaded
        const comps = base.components;
        for (let i = 0; i < comps.length; i++)
        {
            if (!getLogic(comps[i]).isLoaded) return false;
        }

        return true;
    });

    const _isLoaded = computed<boolean>(() =>
    {
        if (!_isSelfLoaded.value) return false;
        const kids = base.children;
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
    const _transformBinding: BufferBinding<TransformUniforms> = { value: {} as TransformUniforms };

    // ---- 方法 ----
    function beforeRender(renderObject: RenderObject): void
    {
        // 初始化 bindingResources（缺失时创建）
        const r_renderObject = reactive(renderObject);
        if (!renderObject.bindingResources) r_renderObject.bindingResources = {};
        const bindingResources = renderObject.bindingResources;
        bindingResources.transform ||= _transformBinding;
        const r_transformUniforms = reactive(_transformBinding.value);
        r_transformUniforms.u_modelMatrix = local2world.value;
        r_transformUniforms.u_ITModelMatrix = ITlocal2world.value;
    }

    function lookAt(target: Vector3, upAxis?: Vector3): void
    {
        const m = matrix.value.clone();
        m.lookAt(target, upAxis);
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        // 写入完整 rotation 对象（toTRS 返回弧度，raw.rotation 缺失时整体赋值，避免子字段修改崩溃）
        reactive(object3D).rotation = { x: rot.x, y: rot.y, z: rot.z };
    }

    function dispose(): void
    {
        const parent = base.parent;
        if (parent)
        {
            const parentChildren = reactive(parent).children as unknown as Object3D[];
            parentChildren.splice(parentChildren.indexOf(object3D), 1);
        }
        setParent(base, null);
        const kids = base.children;
        for (let i = kids.length - 1; i >= 0; i--)
        {
            getLogic(kids[i]).dispose();
        }
        const r_components = reactive(object3D).components as Components[];
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Components;
            r_components.splice(i, 1);
            getLogic(component).dispose();
        }
    }

    // ---- 在 base 上叠加 Object3D 自有字段（复用同一对象引用，保证父子同步 setParent 能查到 parentState） ----
    // entity / components / children / parent / getComponent / getComponents 来自 base（containerLogic/entityLogic）；
    // 其余 Object3D 自有字段在此叠加。直接在 base 上 defineProperties，不创建新对象。
    Object.defineProperties(base, {
        name: { get() { return name.value; }, enumerable: true, configurable: true },
        mouseEnabled: { get() { return mouseEnabled.value; }, enumerable: true, configurable: true },
        scene: { get() { return scene.value; }, enumerable: true, configurable: true },
        activeSelf: { get() { return activeSelf.value; }, enumerable: true, configurable: true },
        activeInHierarchy: { get() { return activeInHierarchy.value; }, enumerable: true, configurable: true },
        boundingBox: { get() { return boundingBox.value; }, enumerable: true, configurable: true },
        position: { get() { return position.value; }, enumerable: true, configurable: true },
        rotation: { get() { return rotation.value; }, enumerable: true, configurable: true },
        scale: { get() { return scale.value; }, enumerable: true, configurable: true },
        matrix: { get() { return matrix.value; }, enumerable: true, configurable: true },
        local2world: { get() { return local2world.value; }, enumerable: true, configurable: true },
        ITlocal2world: { get() { return ITlocal2world.value; }, enumerable: true, configurable: true },
        world2local: { get() { return world2local.value; }, enumerable: true, configurable: true },
        local2worldRotation: { get() { return local2worldRotation.value; }, enumerable: true, configurable: true },
        world2localRotation: { get() { return _world2localRotation.value; }, enumerable: true, configurable: true },
        worldPosition: { get() { return _worldPosition.value; }, enumerable: true, configurable: true },
        isLoaded: { get() { return _isLoaded.value; }, enumerable: true, configurable: true },
        transformUniforms: { get() { return _transformBinding; }, enumerable: true, configurable: true },
        beforeRender: { value: beforeRender, enumerable: true, configurable: true, writable: true },
        lookAt: { value: lookAt, enumerable: true, configurable: true, writable: true },
        dispose: { value: dispose, enumerable: true, configurable: true, writable: true },
    });

    return base as unknown as Object3DLogic;
}

// 注册到统一 logic 分发表
registerLogic('Object3D', object3DLogic);

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
