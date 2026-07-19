import { Matrix4x4, Quaternion, Vector3 } from '@feng3d/math';
import { computed, Computed, effect, logic as getLogic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import { Component, ComponentLogic, Components, isRenderable } from '../component/Component';
import { getComponent, matchType } from '../component/componentQuery';
import type { Geometry } from '../geometry/Geometry';
import type { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { Container } from './Container';
import { object3DDefaults } from './createObject3D';
import type { Feng3dObjectEventMap } from './Feng3dObject';
import { Renderable } from './Renderable';

declare global
{
    interface MixinsObject3DEventMap { }
    interface MixinsPrimitiveObject3D { }
    interface MixinsObject3D { }
}

export interface Object3DEventMap extends MixinsObject3DEventMap, Feng3dObjectEventMap
{
    /**
     * 添加子组件事件
     */
    addComponent: { object3D: Object3D, component: Component };

    /**
     * 移除子组件事件
     */
    removeComponent: { object3D: Object3D, component: Component };

    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: Object3D, child: Object3D }
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: Object3D, child: Object3D };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: Object3D };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: Object3D };

    /**
     * 当Object3D的scene属性被设置是由Scene派发
     */
    addedToScene: Object3D;

    /**
     * 当Object3D的scene属性被清空时由Scene派发
     */
    removedFromScene: Object3D;

    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;

    /**
     * 场景变换改变事件
     */
    scenetransformChanged: void;

    /**
     * 本地转世界矩阵更新事件
     */
    updateLocalToWorldMatrix: void;
}

/**
 * 游戏对象，场景唯一存在的对象类型
 *
 * 纯数据接口：仅声明 readonly 属性，由 {@link createObject3D} 工厂创建实例。
 * 所有行为逻辑（组件管理、层级管理、激活状态、包围盒等）由 {@link object3DLogic} 提供。
 *
 * 原始游戏对象创建等工厂方法以独立函数形式提供：{@link findObject3DChild}。
 */
export interface Object3D extends Container<Object3D>, MixinsObject3D
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
     * 本地旋转（缺失时由 registerLogic 自动填充）
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

/**
 * Object3DLogic 实例接口（由 object3DLogic 工厂函数返回）。
 *
 * 通过 `logic(object3D)` 获取实例（registerLogic 注册了 object3DLogic 工厂）。
 * 显式声明接口以避免 ReturnType 循环引用（返回对象嵌套 entity/container/object3D 字段
 * 指向 Object3D 接口，LogicMap 又引用本类型，会形成循环）。
 */
export interface Object3DLogic
{
    /** 关联的 Object3D 数据（raw，与 entity 同一对象） */
    readonly entity: Object3D;

    /** 父级容器（响应式字段，通过 reactive(logic).parent = value 修改） */
    parent: Object3D | null;

    /** 名称（缺失时返回默认 'Object3D'） */
    readonly name: string;
    /** 是否支持鼠标拾取（缺失时返回默认 true） */
    readonly mouseEnabled: boolean;
    /** 子对象列表（响应式 computed） */
    readonly children: Object3D[];

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
    /** 本地旋转（缺失时返回默认 {0,0,0}） */
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

    /** 获取指定类型的第一个组件 */
    getComponent<T extends Component>(typeName: string): T;
    /** 获取所有匹配类型的组件 */
    getComponents<T extends Component>(typeName: string, results?: T[]): T[];

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;
    /** 让物体看向目标点（仅修改 rotation 数据） */
    lookAt(target: Vector3, upAxis?: Vector3): void;
    /** 释放：从父级移除、递归 dispose 子对象与组件 */
    dispose(): void;
}

/**
 * 创建 Object3DLogic 实例（函数式实现）。
 *
 * 平铺原 EntityLogic / ContainerLogic / Object3DLogic 三层类继承到单一闭包：
 * - Entity 行为：components pre-fill + 自动初始化 effect + getComponent/getComponents
 * - Container 行为：children pre-fill + parent 同步 effect + parent 响应式字段
 * - Object3D 行为：默认值 computed 缺省 + scene/transform 矩阵 + beforeRender/lookAt/dispose
 *
 * 通过 registerLogic('Object3D', object3DLogic) 注册，调用方用 `logic(obj)` 获取实例。
 * raw 数据保持干净（缺失字段不被写入，序列化不含默认值）。
 *
 * 返回类型 {@link Object3DLogic} 通过 ReturnType 推导，供外部类型注解使用。
 */
function object3DLogic(object3D: Object3D)
{
    // ---- 默认值（实例私有，提供稳定引用供响应式追踪） ----
    const _defaultPosition = { x: 0, y: 0, z: 0 };
    const _defaultRotation = { x: 0, y: 0, z: 0 };
    const _defaultScale = { x: 1, y: 1, z: 1 };

    // ---- pre-fill：components / children 必须存在数组（push/splice 写入路径依赖） ----
    if (object3D.components === undefined)
    {
        (object3D as { components: Components[] }).components = [];
    }
    if (object3D.children === undefined)
    {
        (object3D as { children: Object3D[] }).children = [];
    }

    // ---- 字段 computed（默认值 + 派生）：先声明，供下方 effect 引用 ----
    const components = computed(() => reactive(object3D).components as Components[]);
    const children = computed(() => reactive(object3D).children as Object3D[]);

    // 父级容器（响应式字段，通过 reactive(logic).parent = value 修改）
    // 用一个可变对象承载 parent 字段，便于 reactive 包装与 effect 跟踪
    const parentState: { parent: Object3D | null } = { parent: null };

    // ---- Entity 行为：自动初始化 effect ----
    // 已初始化组件去重（同一 component 只 init 一次，跨 logic 实例共享）
    const initialized = object3DLogic._initialized;
    function initComponent(component: Component, owner: Object3D): void
    {
        if (initialized.has(component)) return;
        initialized.add(component);
        const l = getLogic(component) as ComponentLogic;
        if (l && typeof l.init === 'function')
        {
            l.init(owner);
        }
    }
    effect(() =>
    {
        const r_components = components.value;
        for (const r_component of r_components)
        {
            initComponent(toRaw(r_component), object3D);
        }
    });

    // ---- Container 行为：监听 children 变化，自动同步 parent ----
    effect(() =>
    {
        const r_children = children.value;
        for (const r_child of r_children)
        {
            const child = toRaw(r_child) as Object3D;
            const childLogic = getLogic(child);
            // 读取建立响应式依赖
            reactive(childLogic).parent;
            if (childLogic && childLogic.parent !== object3D)
            {
                reactive(childLogic).parent = object3D;
            }
        }
    });

    // ---- 字段 computed（默认值） ----
    const name = computed(() => reactive(object3D).name ?? object3DDefaults.name);
    const tag = computed(() => reactive(object3D).tag ?? object3DDefaults.tag);
    const mouseEnabled = computed(() => reactive(object3D).mouseEnabled ?? object3DDefaults.mouseEnabled);
    const activeSelf = computed(() => reactive(object3D).activeSelf ?? object3DDefaults.activeSelf);
    const assetType = computed(() => reactive(object3D).assetType ?? object3DDefaults.assetType);
    const assetId = computed(() => reactive(object3D).assetId ?? object3DDefaults.assetId);
    const prefabId = computed(() => reactive(object3D).prefabId ?? object3DDefaults.prefabId);
    const position = computed(() => reactive(object3D).position ?? _defaultPosition);
    const rotation = computed(() => reactive(object3D).rotation ?? _defaultRotation);
    const scale = computed(() => reactive(object3D).scale ?? _defaultScale);

    const scene = computed<Scene | null>(() =>
    {
        const sceneComponent = getComponent(object3D, 'Scene') as unknown as Scene | undefined;
        if (sceneComponent) return sceneComponent;
        const parent = parentState.parent;

        return parent ? getLogic(parent).scene : null;
    });

    const activeInHierarchy = computed<boolean>(() =>
    {
        let active = activeSelf.value;
        const parent = parentState.parent;
        if (parent)
        {
            active = active && getLogic(parent).activeInHierarchy;
        }

        return active;
    });

    const boundingBox = computed<BoundingBox>(() => new BoundingBox(object3D));

    const orientation = computed<Quaternion>(() =>
    {
        const { x, y, z } = rotation.value;

        return new Quaternion().fromEuler(x, y, z);
    });

    const matrix = computed<Matrix4x4>(() =>
    {
        const p = position.value;
        const r = rotation.value;
        const s = scale.value;

        return new Matrix4x4().fromTRS(
            new Vector3(p.x, p.y, p.z),
            new Vector3(r.x, r.y, r.z),
            new Vector3(s.x, s.y, s.z));
    });

    const rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r = rotation.value;

        return new Matrix4x4().setRotation(new Vector3(r.x, r.y, r.z));
    });

    const local2world = computed<Matrix4x4>(() =>
    {
        const r_parent = parentState.parent;
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
        const r_parent = parentState.parent;
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
        const comps = components.value;
        for (let i = 0; i < comps.length; i++)
        {
            if (isRenderable(comps[i]))
            {
                return getLogic(comps[i] as Renderable).isLoaded.value;
            }
        }

        return true;
    });

    const _isLoaded = computed<boolean>(() =>
    {
        if (!_isSelfLoaded.value) return false;
        const kids = children.value;
        for (let i = 0; i < kids.length; i++)
        {
            if (!getLogic(kids[i]).isLoaded) return false;
        }

        return true;
    });

    // ---- 方法 ----
    function getComponentMethod<T extends Component>(typeName: string): T
    {
        return components.value.find(c => matchType(c, typeName)) as T;
    }

    function getComponentsMethod<T extends Component>(typeName: string, results: T[] = []): T[]
    {
        for (const c of components.value)
        {
            if (!typeName || matchType(c, typeName)) results.push(c as T);
        }

        return results;
    }

    function beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null): void
    {
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformUniforms = (bindingResources.transform ||= { value: {} as TransformUniforms }).value as TransformUniforms;
        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = local2world.value;
        r_transformUniforms.u_ITModelMatrix = ITlocal2world.value;
    }

    function lookAt(target: Vector3, upAxis?: Vector3): void
    {
        const m = matrix.value.clone();
        m.lookAt(target, upAxis);
        const pos = new Vector3(); const rot = new Vector3(); const scl = new Vector3();
        m.toTRS(pos, rot, scl);
        // 写入完整 rotation 对象（raw.rotation 缺失时整体赋值，避免子字段修改崩溃）
        reactive(object3D).rotation = { x: rot.x, y: rot.y, z: rot.z };
    }

    function dispose(): void
    {
        const parent = parentState.parent;
        if (parent)
        {
            const parentChildren = reactive(parent).children as unknown as Object3D[];
            parentChildren.splice(parentChildren.indexOf(object3D), 1);
        }
        parentState.parent = null;
        const kids = children.value;
        for (let i = kids.length - 1; i >= 0; i--)
        {
            getLogic(kids[i]).dispose();
        }
        const r_components = reactive(object3D).components as Component[];
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Component;
            r_components.splice(i, 1);
            getLogic(component).dispose();
        }
    }

    return {
        entity: object3D,
        get parent() { return parentState.parent; },
        set parent(v: Object3D | null) { parentState.parent = v; },
        get name() { return name.value; },
        get mouseEnabled() { return mouseEnabled.value; },
        get children() { return children.value; },
        get scene() { return scene.value; },
        get activeSelf() { return activeSelf.value; },
        get activeInHierarchy() { return activeInHierarchy.value; },
        get boundingBox() { return boundingBox.value; },
        get position() { return position.value; },
        get rotation() { return rotation.value; },
        get scale() { return scale.value; },
        get matrix() { return matrix.value; },
        get local2world() { return local2world.value; },
        get ITlocal2world() { return ITlocal2world.value; },
        get world2local() { return world2local.value; },
        get local2worldRotation() { return local2worldRotation.value; },
        get world2localRotation() { return _world2localRotation.value; },
        get worldPosition() { return _worldPosition.value; },
        get isLoaded() { return _isLoaded.value; },
        getComponent: getComponentMethod,
        getComponents: getComponentsMethod,
        beforeRender,
        lookAt,
        dispose,
    };
}

namespace object3DLogic
{
    /** 已初始化组件去重（同一 component 只 init 一次，跨 logic 实例共享） */
    export const _initialized = new WeakSet<Component>();
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
