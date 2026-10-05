import type { Entity } from '../core/Entity';
import type { Object3D } from '../core/Object3D';
import type { RenderObject } from '@feng3d/webgpu';


// ---- 组件数据接口 ----

export interface ComponentMap { }
export type Components = ComponentMap[keyof ComponentMap];

/**
 * 组件（纯数据接口）。
 *
 * 每个具体组件接口自行声明 `readonly __type__: 'Xxx'`，logic 通过它分发到对应工厂。
 */
export interface Component
{
}

/**
 * 挂载在 Object3D 上的组件（标记接口）。
 */
export interface Component3D extends Component
{
}

// Renderable 系所有子类型的 __type__ 集合
const _renderableTypes = new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer']);
const _rayCastableTypes = new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer']);

// ---- 组件类型登记表（上层扩展包的接入点） ----

/**
 * 登记项里的「基类型」命中这些名字时，默认算可渲染 / 可拾取。
 *
 * 与上面的 `_renderableTypes` / `_rayCastableTypes` 是同一套语义的**基类型**版本：
 * 上层扩展包登记的是「我继承谁」（如 `CanvasRenderer extends Renderable`），
 * 而不是「我算不算渲染器」——后者由下式派生，避免上层包写重复且可能写错的标记。
 */
const _renderableBaseTypes = new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer']);

/** 内置组件的默认渲染 pass：主场景（forward） */
const DEFAULT_RENDER_PASS = 'forward';
const _rayCastableBaseTypes = new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer']);

/**
 * 组件类型登记项（{@link registerComponentType} 的规范化结果）。
 */
export interface ComponentTypeInfo
{
    /** 该类型继承的基类型名（不含自身） */
    readonly baseTypes: readonly string[];
    /** 是否算可渲染组件（`isRenderable`） */
    readonly renderable: boolean;
    /** 是否算可拾取组件（`isRayCastable`） */
    readonly rayCastable: boolean;
    /**
     * 该类型由哪个渲染 pass 负责渲染（默认 `'forward'`）。
     *
     * 上层扩展包可登记自定义 pass 名（如 `@feng3d/ui` 的 `'ui'`）：主场景的**渲染列表**
     * （`ScenePickCache.blenditems` / `unblenditems`）会跳过它，改由同名的 View pass provider
     * 收集（见 `registerViewPass`）。
     *
     * ⚠️ 只影响渲染列表：**拾取列表**（`activeModels`）仍包含它——否则 UI 会拾取不到，
     * 与登记类型的初衷（让引擎"看见"上层包的类型）相反。
     */
    readonly renderPass: string;
}

/**
 * 登记选项：字段缺省时按 `baseTypes` 派生。
 */
export interface ComponentTypeRegistration
{
    /**
     * 该类型继承的基类型名（不含自身）。
     *
     * 同时用于 `matchType` 的子类型判定——例如上层扩展包登记
     * `{ baseTypes: ['Renderable'] }` 后，`getComponentsInChildren('Renderable')`
     * 与 `matchType(x, 'Component')`（沿内置层次表上溯）都能命中它。
     */
    readonly baseTypes?: readonly string[];
    /** 是否算可渲染组件；缺省时按 `baseTypes` 是否含 Renderable 系基类型派生 */
    readonly renderable?: boolean;
    /** 是否算可拾取组件；缺省时按 `baseTypes` 是否含 RayCastable 系基类型派生 */
    readonly rayCastable?: boolean;
    /**
     * 该类型由哪个渲染 pass 负责渲染（缺省 `'forward'`）。
     *
     * @see ComponentTypeInfo.renderPass
     */
    readonly renderPass?: string;
}

/**
 * 登记表：`__type__` → 登记项。
 *
 * 缓存一律 lazy-init（R2，issue #606）：模块级 `new Map()` 会被
 * `scripts/check-module-side-effects.mjs --strict` 判为 import 期副作用。
 */
let _componentTypes: Map<string, ComponentTypeInfo> | null = null;

/** 取登记表（首次使用时创建） */
function getComponentTypes(): Map<string, ComponentTypeInfo>
{
    if (!_componentTypes) _componentTypes = new Map();

    return _componentTypes;
}

/**
 * 登记一个上层扩展包定义的组件类型，让引擎的**渲染列表 / 拾取 / 类型查询**认识它。
 *
 * ## 为什么需要它
 *
 * `isRenderable` / `isRayCastable` / `matchType` 原先只认引擎内置的几张**硬编码字符串表**，
 * 于是上层包（`@feng3d/ui` / `particlesystem` / `terrain` 这类「源码 import 'feng3d'」的包）
 * 定义的组件等于对引擎隐形：`Scene.models` / `getComponentsInChildren('Renderable')` /
 * `Scene.behaviours` / `Raycaster.pick` 全部扫不到它——组件迁完了也渲染不出来、拾取不到。
 *
 * 分层上不能反过来：`feng3d` 是地基，**不该硬编码上层包的类型名**（它连这些包的依赖都没有）。
 * 所以接入方向是「上层包在注册自己的 Logic 时顺带登记类型」，与本仓既有的
 * `registerLogic` 同一模式（同样是模块顶层的注册调用）。
 *
 * ## 用法
 *
 * ```ts
 * // packages/ui/src/core/CanvasRenderer.ts
 * registerLogic('CanvasRenderer', CanvasRendererLogic);
 * registerComponentType('CanvasRenderer', { baseTypes: ['Renderable'] });
 * ```
 *
 * 能力标记（`renderable` / `rayCastable`）缺省时按 `baseTypes` 派生，一般无需显式写；
 * 只有「算某基类型的子类型、但**不**参与拾取」这类偏离默认的形态才需要显式覆盖
 * （引擎内置的 `ParticleSystem` / `Terrain` 就是这种历史形态，见 `docs/ARCHITECTURE_V2.md`）。
 *
 * @param typeName 组件类型名（`__type__` 字面量）
 * @param registration 基类型与能力标记（可全部缺省，但那样登记项没有意义）
 */
export function registerComponentType(typeName: string, registration: ComponentTypeRegistration = {}): void
{
    const baseTypes = registration.baseTypes ?? [];

    getComponentTypes().set(typeName, {
        baseTypes,
        renderable: registration.renderable ?? baseTypes.some((base) => _renderableBaseTypes.has(base)),
        rayCastable: registration.rayCastable ?? baseTypes.some((base) => _rayCastableBaseTypes.has(base)),
        renderPass: registration.renderPass ?? DEFAULT_RENDER_PASS,
    });
}

/**
 * 查询组件类型登记项（未登记时返回 `undefined`）。
 *
 * 供 `matchType`（`core/Entity.ts`）消费——它同时要看内置层次表与登记表。
 *
 * @param typeName 组件类型名（`__type__` 字面量）
 * @returns 登记项；未登记时为 `undefined`
 */
export function getComponentTypeInfo(typeName: string): ComponentTypeInfo | undefined
{
    return getComponentTypes().get(typeName);
}

/**
 * 组件是否算「可渲染」（进 `Scene.mouseCheckObjects` / 包围盒统计等路径）。
 *
 * 判据 = 内置 `_renderableTypes` **或** 上层包登记的 `renderable` 标记。
 *
 * @param component 组件数据
 * @returns 是则 true
 */
export function isRenderable(component: Components): boolean
{
    const type = (component as { __type__: string }).__type__;

    return _renderableTypes.has(type) || getComponentTypeInfo(type)?.renderable === true;
}

/**
 * 组件是否算「可拾取」（进 `Raycaster.pick`）。
 *
 * 判据 = 内置 `_rayCastableTypes` **或** 上层包登记的 `rayCastable` 标记。
 *
 * @param component 组件数据
 * @returns 是则 true
 */
export function isRayCastable(component: Components): boolean
{
    const type = (component as { __type__: string }).__type__;

    return _rayCastableTypes.has(type) || getComponentTypeInfo(type)?.rayCastable === true;
}

/**
 * 组件由哪个渲染 pass 负责（未登记 / 未指定时 `'forward'`）。
 *
 * 供 `ScenePickCache` 把非 forward 的组件（如 UI 渲染器）排除出主场景渲染列表；
 * 这些组件的渲染由对应的 View pass provider 负责（见 `core/View.ts` 的 `registerViewPass`）。
 *
 * @param component 组件数据
 * @returns pass 名（默认 `'forward'`）
 */
export function getComponentRenderPass(component: Components): string
{
    const type = (component as { __type__: string }).__type__;

    return getComponentTypeInfo(type)?.renderPass ?? DEFAULT_RENDER_PASS;
}

// ---- 组件 logic 接口 ----

/**
 * 组件 logic 接口。
 *
 * 所有 behavior logic 由工厂函数创建并返回本接口的实例。
 * 通过 `logic(component)` 获取实例。
 */
export interface ComponentLogic
{
    /** 关联的组件数据（raw） */
    get component(): Components | undefined;
    /** 所属实体（由 init 注入，只读 getter） */
    get entity(): Entity | null;
    /** 初始化：注入 entity */
    init(entity?: Entity): void;
    /** 渲染前回调 */
    beforeRender(_renderObject: RenderObject): void;
    /** 是否加载完成（异步资源就绪；基类恒 true，含异步资源的组件覆盖） */
    get isLoaded(): boolean;
    /** 释放 */
    dispose(): void;
}

/**
 * 挂载在 Object3D 上的组件 logic 接口（entity 类型收窄为 Object3D）。
 */
export interface Component3DLogic extends ComponentLogic
{
    /** 所属 Object3D（由 init 注入，只读 getter） */
    get entity(): Object3D | null;
}

/**
 * ComponentLogic 系 Logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface ComponentLogicState
{
    /** 关联的组件数据（raw） */
    component: Components | undefined;

    /** 所属实体（由 init 注入） */
    entity: Entity | null;
}

/**
 * ComponentLogic 的**基类行为**（组合用）：成员都读写同一个 `state`。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。子类工厂的用法：
 * ```ts
 * const { state, members } = createComponentLogicBase(data);
 * const logic: XxxLogic = {
 *     get component() { return members.component; },
 *     get entity() { return state.entity as Object3D | null; },   // 需要时按子接口收窄
 *     init(entity) { members.init(entity); },
 *     // ...自身成员
 * };
 * ```
 *
 * @param component 关联的组件数据（raw）
 */
export function createComponentLogicBase(component?: Components): { state: ComponentLogicState; members: ComponentLogic }
{
    const state: ComponentLogicState = { component, entity: null };

    const members: ComponentLogic = {
        /** 关联的组件数据（raw） */
        get component() { return state.component; },
        /** 所属实体（由 init 注入，只读） */
        get entity() { return state.entity; },
        /** 初始化：注入 entity */
        init(entity) { if (entity) state.entity = entity; },
        /** 渲染前回调（默认空） */
        beforeRender(_renderObject) { /* 默认空 */ },
        /** 是否加载完成（基类恒 true，含异步资源的组件覆盖） */
        get isLoaded() { return true; },
        /** 释放（默认空） */
        dispose() { /* 默认空 */ },
    };

    return { state, members };
}

/**
 * 工厂函数：ComponentLogic 的唯一创建入口（组合链最底层）。
 */
export function componentLogic(component?: Components): ComponentLogic
{
    const { state, members } = createComponentLogicBase(component);

    const logic: ComponentLogic = {
        get component() { return state.component; },
        get entity() { return state.entity; },
        init(entity) { members.init(entity); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
    };

    return logic;
}
