import { AssetType } from '../assets/AssetType';
import { Component, isRenderable } from '../component/Component';
import type { Geometry } from '../geometry/Geometry';
import { Container } from './Container';
import type { Feng3dObjectEventMap } from './Feng3dObject';
import { gPartial } from '@feng3d/polyfill';
import { computed, Computed, effect, reactive, toRaw, logic as getLogic, registerLogic } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Matrix4x4, Quaternion, Vector3 } from '@feng3d/math';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { getComponent } from '../component/componentQuery';
import { Renderable } from './Renderable';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BoundingBox } from './BoundingBox';
import { createObject3D } from './createObject3D';
import { ContainerLogic } from './Container';

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
 * 原始游戏对象创建等工厂方法以独立函数形式提供：
 * {@link createPrimitive}、{@link registerPrimitive}、{@link findObject3DChild}。
 */
export interface Object3D extends Container<Object3D>, MixinsObject3D
{
    __type__: 'Object3D';

    /**
     * 名称（缺失时由 registerDefaults 自动填充）
     */
    readonly name?: string;

    /**
     * The tag of this game object.（缺失时由 registerDefaults 自动填充）
     */
    readonly tag?: string;

    /**
     * 自身以及子对象是否支持鼠标拾取（缺失时由 registerDefaults 自动填充）
     */
    readonly mouseEnabled?: boolean;

    /**
     * The local active state of this Object3D.（缺失时由 registerDefaults 自动填充）
     *
     * 通过 reactive(this).activeSelf = value 修改。
     */
    readonly activeSelf?: boolean;

    /**
     * 资源类型（缺失时由 registerDefaults 自动填充）
     */
    readonly assetType?: string;

    /**
     * 资源编号（缺失时由 registerDefaults 自动填充）
     */
    readonly assetId?: string;

    /**
     * 预设资源编号（缺失时由 registerDefaults 自动填充）
     */
    readonly prefabId?: string;

    /**
     * 本地位移（缺失时由 registerDefaults 自动填充）
     */
    readonly position?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地旋转（缺失时由 registerDefaults 自动填充）
     */
    readonly rotation?: { readonly x: number; readonly y: number; readonly z: number };

    /**
     * 本地缩放（缺失时由 registerDefaults 自动填充）
     */
    readonly scale?: { readonly x: number; readonly y: number; readonly z: number };
}

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        transform: BufferBinding<TransformUniforms>;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Object3D: Object3DLogic;
    }
}

/**
 * Object3D 逻辑处理类。
 *
 * 继承链：Object3DLogic → ContainerLogic → EntityLogic
 * - EntityLogic：组件自动初始化 effect + getComponent/getComponents
 * - ContainerLogic：parent 响应式字段 + children→parent 同步 effect
 * - Object3DLogic：scene/transform 矩阵等 computed
 *
 * 所有 computed 字段作为类字段惰性初始化，与声明顺序无关。
 */
export class Object3DLogic extends ContainerLogic
{
    /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
    readonly scene: Computed<Scene | null> = computed<Scene | null>(() =>
    {
        const sceneComponent = getComponent(this.object3D, 'Scene') as unknown as Scene | undefined;
        if (sceneComponent) return sceneComponent;
        const parent = this.parent as Object3D | null;

        return parent ? getLogic(parent).scene.value : null;
    });

    readonly activeInHierarchy: Computed<boolean> = computed<boolean>(() =>
    {
        let active = reactive(this.object3D).activeSelf;
        const parent = this.parent as Object3D | null;
        if (parent)
        {
            active = active && getLogic(parent).activeInHierarchy.value;
        }

        return active;
    });

    readonly boundingBox: Computed<BoundingBox> = computed<BoundingBox>(() => new BoundingBox(this.object3D));

    /** 本地四元数旋转 */
    readonly orientation: Computed<Quaternion> = computed<Quaternion>(() =>
    {
        const r_rotation = reactive(this.object3D.rotation);
        const { x, y, z } = r_rotation;

        return new Quaternion().fromEuler(x, y, z);
    });

    /** 本地变换矩阵 */
    readonly matrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const r_position = reactive(this.object3D.position);
        const r_rotation = reactive(this.object3D.rotation);
        const r_scale = reactive(this.object3D.scale);

        const position = new Vector3(r_position.x, r_position.y, r_position.z);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);
        const scale = new Vector3(r_scale.x, r_scale.y, r_scale.z);

        return new Matrix4x4().fromTRS(position, rotation, scale);
    });

    /** 本地旋转矩阵 */
    readonly rotationMatrix: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const r_rotation = reactive(this.object3D.rotation);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);

        return new Matrix4x4().setRotation(rotation);
    });

    /** 本地转世界矩阵 */
    readonly local2world: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const r_parent = this.parent as Object3D | null;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;

            return this.matrix.value.clone().append(getLogic(parent).local2world.value);
        }

        return this.matrix.value.clone();
    });

    /** 本地转世界逆转置矩阵 */
    readonly ITlocal2world: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        this.local2world.value.clone().invert().transpose());

    /** 世界转本地矩阵 */
    readonly world2local: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        this.local2world.value.clone().invert());

    /** 本地转世界旋转矩阵 */
    readonly local2worldRotation: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
    {
        const m = this.rotationMatrix.value.clone();
        const r_parent = this.parent as Object3D | null;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;
            m.append(getLogic(parent).local2worldRotation.value);
        }

        return m;
    });

    /** 世界转本地旋转矩阵 */
    readonly world2localRotation: Computed<Matrix4x4> = computed<Matrix4x4>(() =>
        this.local2worldRotation.value.clone().invert());

    /** 世界坐标 */
    readonly worldPosition: Computed<Vector3> = computed<Vector3>(() =>
        this.local2world.value.getPosition());

    readonly isSelfLoaded: Computed<boolean> = computed<boolean>(() =>
    {
        const components = this.object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            if (isRenderable(components[i]))
            {
                return getLogic(components[i] as Renderable).isLoaded.value;
            }
        }

        return true;
    });

    readonly isLoaded: Computed<boolean> = computed<boolean>(() =>
    {
        if (!this.isSelfLoaded.value) return false;
        const children = reactive(this.object3D).children as unknown as Object3D[];
        for (let i = 0; i < children.length; i++)
        {
            if (!getLogic(children[i]).isLoaded.value) return false;
        }

        return true;
    });

    constructor(object3D: Object3D)
    {
        super(object3D);
    }

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null)
    {
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformUniforms = (bindingResources.transform ||= { value: {} as TransformUniforms }).value as TransformUniforms;
        //
        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = this.local2world.value;
        r_transformUniforms.u_ITModelMatrix = this.ITlocal2world.value;
    }

    dispose(): void
    {
        const parent = this.parent as Object3D | null;
        if (parent)
        {
            reactive(parent).children.splice(reactive(parent).children.indexOf(this.object3D), 1);
        }
        reactive(this).parent = null;
        const children = reactive(this.object3D).children as unknown as Object3D[];
        for (let i = children.length - 1; i >= 0; i--)
        {
            getLogic(children[i]).dispose();
        }
        const r_components = reactive(this.object3D).components;
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Component;
            r_components.splice(i, 1);
            getLogic(component).dispose();
        }
    }

    /**
     * 关联的 Object3D 数据（来自 ContainerLogic.container，便于内部 computed 访问）。
     */
    protected get object3D(): Object3D
    {
        return this.container as Object3D;
    }
}

// 注册到统一 logic 分发表：Object3DLogic 由类构造函数承担工厂职责
registerLogic('Object3D', (object3D: Object3D) => new Object3DLogic(object3D));

const _registerPrimitives: Record<string, (object3D: Object3D) => void> = {};

export function createPrimitive<K extends string>(type: K, param?: gPartial<Object3D>): Object3D
{
    const g = createObject3D();
    reactive(g).name = type as string;

    getLogic(g);

    const handler = _registerPrimitives[type as string];
    if (handler) handler(g);

    if (param) serialization.setValue(g, param);

    return g;
}

export function registerPrimitive<K extends string>(type: K, handler: (object3D: Object3D) => void): void
{
    if (_registerPrimitives[type as string])
    {
        console.warn(`重复注册原始对象 ${type} ！`);
    }
    _registerPrimitives[type as string] = handler;
}

export function findObject3DChild(object3D: Object3D, name: string): Object3D | undefined
{
    const children = reactive(object3D).children as unknown as Object3D[];
    for (let i = 0; i < children.length; i++)
    {
        const child = children[i];
        if (child.name === name) return child;
    }
    for (let i = 0; i < children.length; i++)
    {
        const found = findObject3DChild(children[i], name);
        if (found) return found;
    }

    return undefined;
}

createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            createPrimitive('Create Empty' as any)
    },
);
