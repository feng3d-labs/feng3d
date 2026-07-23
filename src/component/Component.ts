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
    readonly component: Components | undefined;
    /** 所属实体（由 init 注入，只读 getter） */
    readonly entity: Entity | null;
    /** 初始化：注入 entity */
    init(entity?: Entity): void;
    /** 渲染前回调 */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;
    /** 释放 */
    dispose(): void;
}

/**
 * 挂载在 Object3D 上的组件 logic 接口（entity 类型收窄为 Object3D）。
 */
export interface Component3DLogic extends ComponentLogic
{
    /** 所属 Object3D（由 init 注入，只读 getter） */
    readonly entity: Object3D | null;
}

/**
 * 创建 ComponentLogic 实例（工厂函数，作为组合链最底层）。
 *
 * 子类工厂通过 `const base = componentLogic(data)` 组合复用 component/entity/init 等行为。
 */
export function componentLogic(component?: Components): ComponentLogic
{
    let _entity: Entity | null = null;

    return {
        get component() { return component; },
        get entity() { return _entity; },
        init(entity?: Entity)
        {
            if (entity) _entity = entity;
        },
        beforeRender() { /* 默认空 */ },
        dispose() { /* 默认空 */ },
    };
}
