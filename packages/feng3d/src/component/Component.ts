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

export function isRenderable(component: Components): boolean
{
    return _renderableTypes.has((component as { __type__: string }).__type__);
}

export function isRayCastable(component: Components): boolean
{
    return _rayCastableTypes.has((component as { __type__: string }).__type__);
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
    beforeRender(renderObject: RenderObject): void;
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
 * ComponentLogic 基类（AGENTS 第 3 章 class 模板的基石）。
 *
 * 组合链最底层：子类工厂通过 `const base = componentLogic(data)` 组合复用
 * component/entity/init/beforeRender/dispose 行为（Object.assign /
 * defineProperties 在实例上叠加成员，与 class 实例兼容）。
 * 方法在原型上共享（千级组件场景避免每实例闭包）。
 */
export class ComponentLogicBase implements ComponentLogic
{
    protected readonly _component: Components | undefined;
    protected _entity: Entity | null = null;

    protected constructor(component?: Components)
    {
        this._component = component;
    }

    /** 内部创建入口（protected constructor 的唯一出口，供同文件工厂使用） */
    static create(component?: Components): ComponentLogicBase
    {
        return new ComponentLogicBase(component);
    }

    /** 关联的组件数据（raw） */
    get component(): Components | undefined
    {
        return this._component;
    }

    /** 所属实体（由 init 注入，只读） */
    get entity(): Entity | null
    {
        return this._entity;
    }

    /** 初始化：注入 entity */
    init(entity?: Entity): void
    {
        if (entity) this._entity = entity;
    }

    /** 渲染前回调（默认空） */
    beforeRender(renderObject: RenderObject): void { /* 默认空 */ }

    /** 是否加载完成（基类恒 true，含异步资源的组件覆盖） */
    get isLoaded(): boolean
    {
        return true;
    }

    /** 释放（默认空） */
    dispose(): void { /* 默认空 */ }
}

/**
 * 创建 ComponentLogic 实例（组合链最底层，返回 class 基类实例）。
 */
export function componentLogic(component?: Components): ComponentLogic
{
    return ComponentLogicBase.create(component);
}
