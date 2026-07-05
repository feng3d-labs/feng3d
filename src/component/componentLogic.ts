import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import type { Scene } from '../scene/Scene';
import type { RenderObject } from '@feng3d/webgpu';
import { logic, registerLogic } from '../core/logic';
import type { Component } from './Component';

/**
 * Component 逻辑处理输出。
 *
 * Component 是纯数据，所有行为由 logic(component) 返回的 logic 对象提供。
 */
export interface ComponentLogic
{
    object3D: Object3D;
    init(): void;
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;
    update?(interval: number): void;
    dispose(): void;
}

// 向后兼容别名：各 logic 文件仍使用 registerComponentLogic 注册
export { registerLogic as registerComponentLogic };

/**
 * 获取 Component 的 logic（统一 logic 入口的类型化便捷封装）。
 */
export function componentLogic(component: Component): ComponentLogic
{
    return logic<ComponentLogic>(component);
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
        (l as any).object3D = object3D;
        l.init();
    }
}
