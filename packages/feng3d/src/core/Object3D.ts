import {
    mat4Append,
    mat4Copy,
    mat4FromTRS,
    mat4GetPosition,
    mat4Identity,
    mat4Invert,
    mat4LookAt,
    mat4SetRotation,
    mat4ToTRS,
    mat4Transpose,
    Matrix4x4,
    Vector3,
    Vector3Like,
} from '@feng3d/math';
import { computed, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { Components } from '../component/Component';
import type { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { applyPrefab } from './Prefab';
import { resolveRefs } from './Ref';
import { Container, ContainerLogic, createContainerLogicBase, setParent } from './Container';
import { initComponents } from './Entity';

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
     *
     * 阶段 C 收尾（P7 / M12）：字段类型从内联匿名形状 `{ readonly x; readonly y; readonly z }`
     * 改为引用 `@feng3d/math` 的 {@link Vector3Like}——两者逐字段同形，所以是零风险的等价替换，
     * 但让「场景里的向量字段」有了统一的名字与来源。资源侧同步补上判别字段
     * `__type__: 'Vector3'`（由 `test/resourceFormatGuard.spec.ts` 反向守住）。
     */
    readonly position?: Vector3Like;

    /**
     * 本地旋转（弧度，缺失时由 Object3DLogic 提供默认值）。
     *
     * xyz 为绕各坐标轴的欧拉角，单位弧度，与 three.js Object3D.rotation 约定一致。
     */
    readonly rotation?: Vector3Like;

    /**
     * 本地缩放（缺失时由 Object3DLogic 提供默认值）
     */
    readonly scale?: Vector3Like;
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
 * Object3D 逻辑接口（行为契约，issue #674）。
 *
 * 继承 {@link ContainerLogic}（进而继承 EntityLogic），复用全部 Entity + Container 行为：
 * entity / components / children / parent（只读 getter）/ getComponent / getComponents。
 *
 * 本接口仅声明 Object3D 特有行为（变换矩阵、scene、激活状态、包围盒、beforeRender/lookAt/dispose）。
 *
 * 通过 `logic(object3D)` 获取实例（registerLogic 注册了 {@link object3DLogic}）。
 * raw 数据保持干净（缺失字段不被写入，序列化不含默认值）。
 */
export interface Object3DLogic extends ContainerLogic
{
    /** 子对象列表（收窄为 Object3D[]；运行时委托 Container 基座的 members.children） */
    readonly children: Object3D[];

    /** 父级容器（只读 getter，收窄为 Object3D | null） */
    readonly parent: Object3D | null;

    /** 名称（缺失时返回默认 'Object3D'） */
    readonly name: string;

    /** 是否支持鼠标拾取（缺失时返回默认 true） */
    readonly mouseEnabled: boolean;

    /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
    readonly scene: Scene | null;

    /** 自身激活状态（缺失时返回默认 true） */
    readonly activeSelf: boolean;

    /** 自身+祖先 activeSelf AND */
    readonly activeInHierarchy: boolean;

    /** 轴对齐包围盒（含子对象） */
    readonly boundingBox: BoundingBox;

    /** 本地位移（缺失时返回默认 {0,0,0}） */
    readonly position: { x: number; y: number; z: number };

    /** 本地旋转（弧度，缺失时返回默认 {0,0,0}） */
    readonly rotation: { x: number; y: number; z: number };

    /** 本地缩放（缺失时返回默认 {1,1,1}） */
    readonly scale: { x: number; y: number; z: number };

    /** 本地变换矩阵（由 position/rotation/scale 计算） */
    readonly matrix: Matrix4x4;

    /** 本地转世界矩阵（含 parent 链） */
    readonly local2world: Matrix4x4;

    /** 本地转世界逆转置矩阵 */
    readonly ITlocal2world: Matrix4x4;

    /** 世界转本地矩阵 */
    readonly world2local: Matrix4x4;

    /** 本地转世界旋转矩阵（含 parent 链） */
    readonly local2worldRotation: Matrix4x4;

    /** 世界转本地旋转矩阵 */
    readonly world2localRotation: Matrix4x4;

    /** 世界坐标 */
    readonly worldPosition: Vector3;

    /** 自身+子孙是否加载完成 */
    readonly isLoaded: boolean;

    /**
     * transform uniform 的稳定 binding 实例（模型矩阵 + 逆转置矩阵）。
     *
     * 整个 Logic 生命周期同一引用，供主 Pass / 阴影 Pass 的
     * renderObject.bindingResources.transform 共享（每对象一个 transform GPUBuffer）。
     */
    readonly transformUniforms: BufferBinding<TransformUniforms>;

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject): void;

    /**
     * 让物体看向目标点（仅修改 rotation 数据）
     *
     * @param target 目标位置（任意提供 `x/y/z` 的对象，可直接传字面量）
     * @param upAxis 向上朝向（同上；缺省为 Y 轴）
     */
    lookAt(target: Vector3Like, upAxis?: Vector3Like): void;

    /** 释放：从父级移除、递归 dispose 子对象与组件 */
    dispose(): void;
}

/**
 * 父级的 logic（**取不到时为 `null`**，调用方必须显式处理——R6）。
 *
 * 两种"取不到"都会真实发生（issue #177 的第二处报错
 * `Cannot read properties of undefined (reading 'elements')`，实测于反复卸载/重建场景视图）：
 *
 * - 父级类型未注册 → `logic()` 返回 `null`；
 * - 父级的 logic **正在构造中** → 注册表里此刻存的是占位对象，读它的任何 getter 都是
 *   `undefined`，于是顺着 `Matrix4x4.append(undefined)` 炸在矩阵里——堆栈完全指不到真凶。
 *
 * 取不到时按"没有父级"处理（用本地矩阵）。这是构造期的一瞬间，比让整条 computed 链抛异常要好。
 *
 * 原为 class 的私有 getter `#parentLogic`（issue #674 改为模块级函数、显式传父级数据）。
 *
 * @param parent 父级数据（raw；来自 Container 基座的 members.parent）
 * @returns 父级 logic（取不到时为 `null`）
 */
function getParentLogic(parent: Container | null): Object3DLogic | null
{
    if (!parent) return null;

    const parentLogic = getLogic(toRaw(parent) as Object3D) as Object3DLogic | undefined;
    // 真 logic 上 `local2world` 是 getter；占位对象上取不到 → 说明还在构造中
    if (!parentLogic || typeof (parentLogic as { local2world?: unknown }).local2world === 'undefined') return null;

    return parentLogic;
}

/**
 * 工厂函数：Object3DLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * 形态：**工厂闭包直接返回对象字面量**——没有共享原型、没有 this、没有 `_` 前缀状态字段；
 * 继承成员（Entity / Container）在对象字面量里**显式列出**，委托 Container 基座的 members；
 * 自身状态是闭包内 `const`，自身行为读闭包 computed。
 *
 * Object3DLogic 是这条链的最派生：装配完 Container 基类状态与本类 computed 字段后，
 * 才在此处调用 {@link initComponents}（issue #222——组件 init 需看到最终的
 * components / children 与本类 computed）。
 *
 * @param data 游戏对象数据（raw）
 */
export function object3DLogic(data: Object3D): Object3DLogic
{
    // Prefab 实例化（设计 3.6）：prefabId + overrides → 深拷贝模板 + 递归合并 overrides
    // （构造期、非响应式；模板不进运行时响应式追踪）。必须在装配基类状态前执行：
    // 基类状态注册组件自动初始化 effect 时，需看到最终的 components/children。
    applyPrefab(data);
    // $ref 共享引用解析（设计 3.7）：{ $ref: 'x' } → 注册表中的同一 raw 对象
    resolveRefs(data);

    const { state, members } = createContainerLogicBase(data);

    // ---- 默认值（实例私有，提供稳定引用供响应式追踪） ----
    const defaultPosition = { x: 0, y: 0, z: 0 };
    const defaultRotation = { x: 0, y: 0, z: 0 };
    const defaultScale = { x: 1, y: 1, z: 1 };

    // ---- 字段 computed（默认值） ----
    // 缺省字段不写回 raw（保持序列化干净），仅在 computed 内用字面量回退默认值。
    const name = computed(() => reactive(data).name ?? 'Object3D');
    const mouseEnabled = computed(() => reactive(data).mouseEnabled ?? true);
    const activeSelf = computed(() => reactive(data).activeSelf ?? true);
    const position = computed(() => reactive(data).position ?? defaultPosition);
    const rotation = computed(() => reactive(data).rotation ?? defaultRotation);
    const scale = computed(() => reactive(data).scale ?? defaultScale);

    const scene = computed<Scene | null>(() =>
    {
        const sceneComponent = members.getComponent<Scene>('Scene');
        if (sceneComponent) return sceneComponent;

        return getParentLogic(members.parent)?.scene ?? null;
    });

    const activeInHierarchy = computed<boolean>(() =>
    {
        const active = activeSelf.value;
        const parentLogic = getParentLogic(members.parent);

        return parentLogic ? active && parentLogic.activeInHierarchy : active;
    });

    const boundingBox = computed<BoundingBox>(() => new BoundingBox(data));

    const matrix = computed<Matrix4x4>(() =>
    {
        const p = position.value;
        const r = rotation.value;
        const s = scale.value;

        // 阶段 C-e：`Matrix4x4` 的 class 已删除，装配点显式补判别字段（方案 §11.7.7 的 D1）
        return { __type__: 'Matrix4x4', ...mat4FromTRS(
            { x: p.x, y: p.y, z: p.z },
            { x: r.x, y: r.y, z: r.z },
            { x: s.x, y: s.y, z: s.z }) };
    });

    const rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r = rotation.value;
        // 与 `new Matrix4x4().setRotation(rot)` 等价：`mat4SetRotation` 的 `a` 提供位移与缩放，
        // 原 class 形态传的是「刚 new 出来的单位矩阵」，所以这里显式给一个单位矩阵基准
        const base: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };

        return { __type__: 'Matrix4x4', ...mat4SetRotation(base, { x: r.x, y: r.y, z: r.z }) };
    });

    const local2world = computed<Matrix4x4>(() =>
    {
        const parentLogic = getParentLogic(members.parent);
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(matrix.value) };
        if (parentLogic)
        {
            mat4Append(m, parentLogic.local2world, m);
        }

        return m;
    });

    const ITlocal2world = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(local2world.value) };

        mat4Invert(m, m);
        mat4Transpose(m, m);

        return m;
    });

    const world2local = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(local2world.value) };

        mat4Invert(m, m);

        return m;
    });

    const local2worldRotation = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(rotationMatrix.value) };
        const parentLogic = getParentLogic(members.parent);
        if (parentLogic)
        {
            mat4Append(m, parentLogic.local2worldRotation, m);
        }

        return m;
    });

    const world2localRotation = computed<Matrix4x4>(() =>
    {
        const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(local2worldRotation.value) };

        mat4Invert(m, m);

        return m;
    });
    const worldPosition = computed<Vector3>(() =>
    {
        // 阶段 C-f：`Vector3` 的 class 已删除，装配点显式写判别字段
        const position: Vector3 = { __type__: 'Vector3', x: 0, y: 0, z: 0 };

        mat4GetPosition(local2world.value, position);

        return position;
    });

    const isSelfLoaded = computed<boolean>(() =>
    {
        // 通用组件加载状态（ComponentLogic.isLoaded，基类恒 true）：
        // 不探测具体组件类型——含异步资源的组件自行覆盖 isLoaded
        const comps = members.components;
        for (let i = 0; i < comps.length; i++)
        {
            if (!getLogic(comps[i]).isLoaded) return false;
        }

        return true;
    });

    const isLoaded = computed<boolean>(() =>
    {
        if (!isSelfLoaded.value) return false;
        const kids = members.children as unknown as Object3D[];
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
    // 装配时求值一次 local2world（首帧本就需要），之后仅在 beforeRender 消费点
    // 做字段级更新（不替换 .value 对象，失效粒度最小）。
    const transformBinding: BufferBinding<TransformUniforms> = { value: {} as TransformUniforms };

    const logic: Object3DLogic = {
        // ---- Entity / Container 基类成员（显式列出，委托基座 members）----
        /** 关联的 Entity 数据（raw） */
        get entity() { return members.entity; },
        /** 组件列表（响应式 computed） */
        get components() { return members.components; },
        /** 获取指定类型的第一个组件 */
        getComponent<T extends Components>(typeName: string): T { return members.getComponent<T>(typeName); },
        /** 获取所有匹配类型的组件 */
        getComponents<T extends Components>(typeName: string, results?: T[]): T[] { return members.getComponents<T>(typeName, results); },
        /** 子对象列表（收窄为 Object3D[]） */
        get children() { return members.children as unknown as Object3D[]; },
        /** 父级容器（只读 getter，收窄为 Object3D | null） */
        get parent() { return members.parent as unknown as Object3D | null; },
        /** 在自身及子孙中查找指定类型的第一个组件 */
        getComponentInChildren<T extends Components>(typeName: string, includeInactive?: boolean): T { return members.getComponentInChildren<T>(typeName, includeInactive); },
        /** 在自身及子孙中查找所有匹配类型的组件 */
        getComponentsInChildren<T extends Components>(typeName: string, includeInactive?: boolean, results?: T[]): T[] { return members.getComponentsInChildren<T>(typeName, includeInactive, results); },
        /** 在自身及父级中查找指定类型的第一个组件 */
        getComponentInParent<T extends Components>(typeName: string, includeInactive?: boolean): T { return members.getComponentInParent<T>(typeName, includeInactive); },
        /** 在自身及父级中查找所有匹配类型的组件 */
        getComponentsInParent<T extends Components>(typeName: string, includeInactive?: boolean, results?: T[]): T[] { return members.getComponentsInParent<T>(typeName, includeInactive, results); },

        // ---- Object3D 自身成员 ----
        /** 名称（缺失时返回默认 'Object3D'） */
        get name() { return name.value; },
        /** 是否支持鼠标拾取（缺失时返回默认 true） */
        get mouseEnabled() { return mouseEnabled.value; },
        /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
        get scene() { return scene.value; },
        /** 自身激活状态（缺失时返回默认 true） */
        get activeSelf() { return activeSelf.value; },
        /** 自身+祖先 activeSelf AND */
        get activeInHierarchy() { return activeInHierarchy.value; },
        /** 轴对齐包围盒（含子对象） */
        get boundingBox() { return boundingBox.value; },
        /** 本地位移（缺失时返回默认 {0,0,0}） */
        get position() { return position.value; },
        /** 本地旋转（弧度，缺失时返回默认 {0,0,0}） */
        get rotation() { return rotation.value; },
        /** 本地缩放（缺失时返回默认 {1,1,1}） */
        get scale() { return scale.value; },
        /** 本地变换矩阵（由 position/rotation/scale 计算） */
        get matrix() { return matrix.value; },
        /** 本地转世界矩阵（含 parent 链） */
        get local2world() { return local2world.value; },
        /** 本地转世界逆转置矩阵 */
        get ITlocal2world() { return ITlocal2world.value; },
        /** 世界转本地矩阵 */
        get world2local() { return world2local.value; },
        /** 本地转世界旋转矩阵（含 parent 链） */
        get local2worldRotation() { return local2worldRotation.value; },
        /** 世界转本地旋转矩阵 */
        get world2localRotation() { return world2localRotation.value; },
        /** 世界坐标 */
        get worldPosition() { return worldPosition.value; },
        /** 自身+子孙是否加载完成 */
        get isLoaded() { return isLoaded.value; },
        /**
         * transform uniform 的稳定 binding 实例（模型矩阵 + 逆转置矩阵）。
         *
         * 整个 Logic 生命周期同一引用，供主 Pass / 阴影 Pass 的
         * renderObject.bindingResources.transform 共享（每对象一个 transform GPUBuffer）。
         */
        get transformUniforms() { return transformBinding; },
        /** 渲染前写入 transform uniform */
        beforeRender(renderObject: RenderObject): void
        {
            // 初始化 bindingResources（缺失时创建）
            const r_renderObject = reactive(renderObject);
            if (!renderObject.bindingResources) r_renderObject.bindingResources = {};
            const bindingResources = renderObject.bindingResources!;
            bindingResources.transform ||= transformBinding;
            const r_transformUniforms = reactive(transformBinding.value as TransformUniforms);
            r_transformUniforms.u_modelMatrix = local2world.value;
            r_transformUniforms.u_ITModelMatrix = ITlocal2world.value;
        },
        /**
         * 让物体看向目标点（仅修改 rotation 数据）
         *
         * @param target 目标位置（任意提供 `x/y/z` 的对象，可直接传字面量）
         * @param upAxis 向上朝向（同上；缺省为 Y 轴）
         */
        lookAt(target: Vector3Like, upAxis?: Vector3Like): void
        {
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，改用纯数据 out + 纯函数（就地语义不变）
            const m: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Copy(matrix.value) };

            mat4LookAt(m, target, upAxis, m);
            const pos = { x: 0, y: 0, z: 0 }; const rot = { x: 0, y: 0, z: 0 }; const scl = { x: 0, y: 0, z: 0 };

            mat4ToTRS(m, pos, rot, scl);
            // 写入完整 rotation 对象（toTRS 返回弧度，raw.rotation 缺失时整体赋值，避免子字段修改崩溃）
            reactive(data as Object3D).rotation = { x: rot.x, y: rot.y, z: rot.z };
        },
        /** 释放：从父级移除、递归 dispose 子对象与组件 */
        dispose(): void
        {
            const parent = logic.parent;
            if (parent)
            {
                const parentChildren = reactive(parent).children as unknown as Object3D[];
                parentChildren.splice(parentChildren.indexOf(data as Object3D), 1);
            }
            setParent(data, null);
            const kids = logic.children;
            for (let i = kids.length - 1; i >= 0; i--)
            {
                getLogic(kids[i]).dispose();
            }
            const r_components = reactive(data as Object3D).components as Components[];
            for (let i = r_components.length - 1; i >= 0; i--)
            {
                const component = toRaw(r_components[i]) as unknown as Components;
                r_components.splice(i, 1);
                getLogic(component).dispose();
            }
        },
    };

    // Object3DLogic 是最派生：此时 children 已 pre-fill、父子同步 effect 已注册、
    // 本类的 computed 字段也已初始化，才轮到组件 init（issue #222）。
    initComponents(logic, state);

    return logic;
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
