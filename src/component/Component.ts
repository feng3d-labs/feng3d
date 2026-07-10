import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import type { Scene } from '../scene/Scene';
import type { RenderObject } from '@feng3d/webgpu';
import { logic } from '@feng3d/reactivity';

// ---- 组件数据接口 ----

export interface ComponentMap { }
export type Components = ComponentMap[keyof ComponentMap];

/**
 * 组件（纯数据接口）。
 *
 * 所有行为逻辑（init/beforeRender/update/dispose 及各类 computed）由
 * `logic(component)` 返回的 logic 对象提供。
 *
 * `__type__` 标识组件类型，logic 通过它分发到对应 logic 工厂。
 *
 * 组件查询与增删使用 {@link componentQuery} 中的工具函数。
 */
export interface Component
{
    /**
     * 组件类型名（与类名相同），用于 logic 分发
     */
    readonly __type__: string;
}

// Renderable 系所有子类型的 __type__ 集合
const _renderableTypes = new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);
const _rayCastableTypes = new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water']);

export function isRenderable(component: Component): boolean
{
    return _renderableTypes.has(component.__type__);
}

export function isRayCastable(component: Component): boolean
{
    return _rayCastableTypes.has(component.__type__);
}

// ---- 组件 logic 基类 ----

/**
 * Component 逻辑处理基类。
 *
 * Component 是纯数据，所有行为由 logic(component) 返回的 logic 对象提供。
 *
 * 构造函数为 protected：外部不能直接 new，只能通过 logic() 工厂创建。
 * 子类继承本类后，用 registerLogic 注册工厂 `(data) => new XxxLogic(data)`。
 */
export class ComponentLogic
{
    /** 所属 Object3D（由 init 在初始化时注入，只读） */
    object3D: Object3D | null = null;

    /** 关联的组件数据（构造函数注入，只读） */
    get component(): Component | undefined { return this._component; }
    protected _component?: Component;

    protected constructor(component?: Component)
    {
        this._component = component;
    }

    /**
     * 初始化：注入 object3D（若有），子类覆盖时需调 super.init(object3D)。
     */
    init(object3D?: Object3D): void
    {
        if (object3D)
        {
            this.object3D = object3D;
        }
    }

    beforeRender(_renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null): void { /* 默认空 */ }

    dispose(): void { /* 默认空，子类覆盖 */ }
}

// ---- 组件初始化去重 ----

const _initialized = new WeakSet<Component>();

/**
 * 初始化组件 logic：注入 object3D 并调用 init（去重，同一 component 只初始化一次）。
 * 由 entityLogic 在组件 push 时调用。
 */
export function initComponent(component: Component, object3D: Object3D): void
{
    if (_initialized.has(component)) return;
    _initialized.add(component);

    const l = logic(component) as ComponentLogic;
    if (l && typeof l.init === 'function')
    {
        l.init(object3D);
    }
}
