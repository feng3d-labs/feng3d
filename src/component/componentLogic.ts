import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import type { Scene } from '../scene/Scene';
import type { RenderObject } from '@feng3d/webgpu';
import { logic, registerLogic } from '@feng3d/reactivity';
import type { Component } from './Component';

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
    /** 所属 Object3D（由 initComponent 在 init 前注入） */
    object3D: Object3D | null = null;

    /** 关联的组件数据（构造函数注入，只读） */
    get component(): Component | undefined { return this._component; }
    protected _component?: Component;

    protected constructor(component?: Component)
    {
        this._component = component;
    }

    init(): void { /* 默认空，子类覆盖 */ }

    beforeRender(_renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null): void { /* 默认空 */ }

    dispose(): void { /* 默认空，子类覆盖 */ }
}

// 向后兼容别名：各 logic 文件仍使用 registerComponentLogic 注册
export { registerLogic as registerComponentLogic };

/**
 * 获取 Component 的 logic（统一 logic 入口的类型化便捷封装）。
 */
export function componentLogic(component: Component): ComponentLogic
{
    return logic(component);
}

// ---- object3D 注入：由 entityLogic 在组件 push 时调用 ----

const _initialized = new WeakSet<Component>();

/**
 * 由 entityLogic 调用：注入 object3D 并 init。
 */
export function initComponent(component: Component, object3D: Object3D): void
{
    if (_initialized.has(component)) return;
    _initialized.add(component);

    const l = componentLogic(component);
    if (l && typeof l.init === 'function')
    {
        l.object3D = object3D;
        l.init();
    }
}
