import type { Entity } from '../core/Entity';
import type { Object3D } from '../core/Object3D';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import type { RenderObject } from '@feng3d/webgpu';

// ---- 组件数据接口 ----

export interface ComponentMap { }
export type Components = ComponentMap[keyof ComponentMap];

/**
 * 组件（纯数据接口）。
 *
 * 所有行为逻辑（init/beforeRender/update/dispose 及各类 computed）由
 * `logic(component)` 返回的 logic 对象提供。
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
const _renderableTypes = new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);
const _rayCastableTypes = new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);

export function isRenderable(component: Components): boolean
{
    return _renderableTypes.has((component as { __type__: string }).__type__);
}

export function isRayCastable(component: Components): boolean
{
    return _rayCastableTypes.has((component as { __type__: string }).__type__);
}

/**
 * 组件 logic 基类。
 *
 * 后续将转换为工厂函数，当前保留以兼容未转换的子类。
 */
export class ComponentLogic
{
    /** 所属实体（由 init 在初始化时注入，只读 getter） */
    get entity(): Entity | null { return this._entity; }
    protected _entity: Entity | null = null;

    /** 关联的组件数据（构造函数注入，只读） */
    get component(): Components | undefined { return this._component; }
    protected _component?: Components;

    protected constructor(component?: Components)
    {
        this._component = component;
    }

    /**
     * 初始化：注入 entity（若有），子类覆盖时需调 super.init(entity)。
     */
    init(entity?: Entity): void
    {
        if (entity)
        {
            this._entity = entity;
        }
    }

    beforeRender(_renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null): void { /* 默认空 */ }

    dispose(): void { /* 默认空，子类覆盖 */ }
}

/**
 * 挂载在 Object3D 上的组件 logic 基类。
 *
 * 继承 ComponentLogic，将 entity 返回类型从 Entity 收窄为 Object3D。
 */
export class Component3DLogic extends ComponentLogic
{
    /** 所属 Object3D（由 init 在初始化时注入，只读 getter） */
    get entity(): Object3D | null { return this._entity as Object3D; }
}
