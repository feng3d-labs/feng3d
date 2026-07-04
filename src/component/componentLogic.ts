import type { Camera } from '../cameras/Camera';
import type { Object3D } from '../core/Object3D';
import type { Scene } from '../scene/Scene';
import type { RenderObject } from '@feng3d/webgpu';
import type { Component } from './Component';

/**
 * Component 逻辑处理输出。
 *
 * Component 是纯数据，所有行为（init/beforeRender/update/dispose 及各类 computed）
 * 由 componentLogic 返回的 logic 对象提供。
 *
 * 生命周期由外部统一分发：
 * - `init`：entityLogic 在组件被 push 到 components 时调用一次
 * - `beforeRender`：渲染器每帧调用，收集渲染数据
 * - `update`：仅 Behaviour 系，由 sceneLogic 每帧驱动
 * - `dispose`：object3DLogic.dispose 移除组件时调用
 *
 * 响应式使用规则：
 * 1. 监听 — 读取 reactive(component) 的属性建立响应式依赖
 * 2. 修改 — 写入 reactive(component) 的属性触发响应式更新
 * 3. 传递 — 传递原始对象（非响应式对象）给其他函数
 */
export interface ComponentLogic
{
    /** 组件附加的 Object3D（由 entityLogic 在组件 push 时注入；logic 内部可写） */
    object3D: Object3D;

    /**
     * 初始化。组件被添加到 Object3D 时调用一次。
     *
     * 子类 logic 在此建立 effect / 注册外部订阅等。
     */
    init(): void;

    /**
     * 每帧渲染前执行，收集渲染数据写入 renderObject.bindingResources。
     *
     * @param renderObject 渲染对象
     * @param scene 场景
     * @param camera 摄像机
     */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;

    /**
     * 每帧更新。仅 Behaviour 系组件实现，由 sceneLogic 驱动。
     *
     * @param interval 帧间隔（毫秒）
     */
    update?(interval: number): void;

    /**
     * 销毁。移除 effect / 外部订阅、清理引用。
     */
    dispose(): void;
}

/**
 * 组件 logic 工厂。根据 component 的 __component__ 注册名查找对应工厂。
 */
type ComponentLogicFactory = (component: Component) => ComponentLogic;

const logicMap = new WeakMap<Component, ComponentLogic>();
const _factories = new Map<string, ComponentLogicFactory>();

/**
 * 注册组件 logic 工厂。
 *
 * 由各组件类对应的 xLogic 模块在加载时调用，注册 `__component__.name` → factory。
 *
 * @param name 组件名称（对应 ComponentInfo.name）
 * @param factory 工厂函数
 */
export function registerComponentLogic(name: string, factory: ComponentLogicFactory): void
{
    if (_factories.has(name))
    {
        console.warn(`重复注册组件 logic：${name}`);
    }
    _factories.set(name, factory);
}

/**
 * 获取 Component 的逻辑处理输出。
 *
 * 使用 WeakMap 缓存，同一 Component 始终返回同一 logic 对象。
 * 首次获取时根据 component 的 __component__ 注册名查找工厂创建 logic。
 *
 * @param component 组件
 */
export function componentLogic(component: Component): ComponentLogic
{
    let logic = logicMap.get(component);
    if (logic) return logic;

    logic = createComponentLogic(component);
    logicMap.set(component, logic);

    return logic;
}

function createComponentLogic(component: Component): ComponentLogic
{
    // __component__ 由 @RegisterComponent 注册到构造函数原型上，需沿原型链查找
    const info = (component as any).__component__;
    const name = info?.name as string | undefined;
    const factory = name ? _factories.get(name) : undefined;

    if (!factory)
    {
        // 未注册 factory 的组件（如 Component 基类本身或未迁移的子类）使用默认空 logic
        return createDefaultComponentLogic(component);
    }

    return factory(component);
}

/**
 * 默认空 ComponentLogic，用于未注册专属 factory 的组件。
 */
function createDefaultComponentLogic(component: Component): ComponentLogic
{
    return {
        object3D: null as any,
        init() { /* no-op */ },
        beforeRender() { /* no-op */ },
        dispose() { logicMap.delete(component); },
    };
}

// ---- object3D 注入：由 entityLogic 在组件 push 时调用 ----

/**
 * 注入组件附加的 Object3D。
 *
 * 由 entityLogic 调用：组件被 push 到 reactive(object3D).components 时，
 * entityLogic 的 effect 获取该组件的 logic 并注入 object3D，随后调用 init。
 *
 * @param component 组件
 * @param object3D 附加到的 Object3D
 */
export function setComponentObject3D(component: Component, object3D: Object3D): void
{
    const logic = componentLogic(component);
    (logic as any).object3D = object3D;
}

/**
 * 初始化组件（注入 object3D 后调用）。
 *
 * 幂等：内部用 WeakSet 防止重复 init。
 */
const _initialized = new WeakSet<Component>();

/**
 * 由 entityLogic 调用：注入 object3D 并 init。
 *
 * @param component 组件
 * @param object3D 附加到的 Object3D
 */
export function initComponent(component: Component, object3D: Object3D): void
{
    if (_initialized.has(component)) return;
    _initialized.add(component);

    setComponentObject3D(component, object3D);
    componentLogic(component).init();
}
