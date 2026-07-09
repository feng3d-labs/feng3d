import { isRenderable } from "../component/Component";
import { gPartial } from '@feng3d/polyfill';
import { computed, Computed, effect, reactive, toRaw } from '@feng3d/reactivity';
import { serialization } from '@feng3d/serialization';
import { Matrix4x4, Quaternion, Vector3 } from '@feng3d/math';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { Component } from '../component/Component';
import { componentLogic } from '../component/componentLogic';
import { getComponent } from '../component/componentQuery';
import { Renderable } from './Renderable';
import { renderableLogic } from './renderableLogic';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BoundingBox } from './BoundingBox';
import { Object3D } from './Object3D';
import { createObject3D } from './createObject3D';
import { ContainerLogic, createContainerLogic } from './containerLogic';
import { createEntityLogic } from './entityLogic';
import { logic as getLogic, registerLogic } from '@feng3d/reactivity';

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
 * Object3D 逻辑处理输出。
 *
 * 继承 ContainerLogic（parent 响应式字段）。内部组合 createContainerLogic
 * （parent 同步）与 createEntityLogic（组件自动初始化）。
 */
export interface Object3DLogic extends ContainerLogic
{
    readonly parent: Object3D | null;
    /** 所属场景（派生：自身持 Scene 组件则为自身，否则由 parent 链派生） */
    readonly scene: Computed<Scene | null>;
    readonly activeInHierarchy: Computed<boolean>;
    readonly isSelfLoaded: Computed<boolean>;
    readonly isLoaded: Computed<boolean>;
    readonly boundingBox: Computed<BoundingBox>;

    /** 本地四元数旋转 */
    readonly orientation: Computed<Quaternion>;
    /** 本地变换矩阵 */
    readonly matrix: Computed<Matrix4x4>;
    /** 本地旋转矩阵 */
    readonly rotationMatrix: Computed<Matrix4x4>;
    /** 本地转世界矩阵 */
    readonly local2world: Computed<Matrix4x4>;
    /** 本地转世界逆转置矩阵 */
    readonly ITlocal2world: Computed<Matrix4x4>;
    /** 世界转本地矩阵 */
    readonly world2local: Computed<Matrix4x4>;
    /** 本地转世界旋转矩阵 */
    readonly local2worldRotation: Computed<Matrix4x4>;
    /** 世界转本地旋转矩阵 */
    readonly world2localRotation: Computed<Matrix4x4>;
    /** 世界坐标 */
    readonly worldPosition: Computed<Vector3>;

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;

    dispose(): void;
}

/**
 * 创建 Object3D 的 logic。
 *
 * 内部组合 createContainerLogic（parent 同步）与 createEntityLogic（组件自动初始化）。
 */
export function createObject3DLogic(object3D: Object3D): Object3DLogic
{
    // 累积式 logic 对象：Object3DLogic 就是扩展了自身字段的 ContainerLogic。
    // createContainerLogic 在本对象上设置 parent 字段 + children→parent 同步 effect，
    // 随后各 computed/method 继续填充本对象，最终直接 return 它（共用一个对象）。
    const logic = {} as Object3DLogic;

    // 先初始化自身组件（initComponent 同步执行），再级联子级
    createEntityLogic(object3D);
    createContainerLogic(object3D, logic);

    // scene 为派生 computed：自身持 Scene 组件则为该 Scene（场景根节点），
    // 否则由 parent 链派生。不再写入 Object3D 数据，避免数据冗余。
    const scene = computed<Scene | null>(() =>
    {
        const sceneComponent = getComponent(object3D, 'Scene') as unknown as Scene | undefined;
        if (sceneComponent) return sceneComponent;
        const parent = logic.parent as Object3D | null;

        return parent ? getLogic(parent).scene.value : null;
    });

    const activeInHierarchy = computed<boolean>(() =>
    {
        let active = reactive(object3D).activeSelf;
        const parent = logic.parent as Object3D | null;
        if (parent)
        {
            active = active && getLogic(parent).activeInHierarchy.value;
        }

        return active;
    });

    const boundingBox = computed<BoundingBox>(() => new BoundingBox(object3D));

    // ---- transform computed（原 transformLogic 合并） ----

    const orientation = computed<Quaternion>(() =>
    {
        const r_rotation = reactive(object3D.rotation);
        const { x, y, z } = r_rotation;

        return new Quaternion().fromEuler(x, y, z);
    });

    const matrix = computed<Matrix4x4>(() =>
    {
        const r_position = reactive(object3D.position);
        const r_rotation = reactive(object3D.rotation);
        const r_scale = reactive(object3D.scale);

        const position = new Vector3(r_position.x, r_position.y, r_position.z);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);
        const scale = new Vector3(r_scale.x, r_scale.y, r_scale.z);

        return new Matrix4x4().fromTRS(position, rotation, scale);
    });

    const rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r_rotation = reactive(object3D.rotation);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);

        return new Matrix4x4().setRotation(rotation);
    });

    const local2world = computed<Matrix4x4>(() =>
    {
        const r_parent = logic.parent as Object3D | null;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;

            return matrix.value.clone().append(getLogic(parent).local2world.value);
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
        const r_parent = logic.parent as Object3D | null;
        if (r_parent)
        {
            const parent = toRaw(r_parent) as Object3D;
            m.append(getLogic(parent).local2worldRotation.value);
        }

        return m;
    });

    const world2localRotation = computed<Matrix4x4>(() =>
        local2worldRotation.value.clone().invert());

    const worldPosition = computed<Vector3>(() =>
        local2world.value.getPosition());

    function beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null)
    {
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformUniforms = (bindingResources.transform ||= { value: {} as TransformUniforms }).value as TransformUniforms;
        //
        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = local2world.value;
        r_transformUniforms.u_ITModelMatrix = ITlocal2world.value;
    }

    const isSelfLoaded = computed<boolean>(() =>
    {
        const components = object3D.components;
        for (let i = 0; i < components.length; i++)
        {
            if (isRenderable(components[i]))
            {
                return renderableLogic(components[i] as Renderable).isLoaded.value;
            }
        }

        return true;
    });

    const isLoaded = computed<boolean>(() =>
    {
        if (!isSelfLoaded.value) return false;
        const children = reactive(object3D).children as unknown as Object3D[];
        for (let i = 0; i < children.length; i++)
        {
            if (!getLogic(children[i]).isLoaded.value) return false;
        }

        return true;
    });

    function dispose(): void
    {
        const parent = logic.parent as Object3D | null;
        if (parent)
        {
            reactive(parent).children.splice(reactive(parent).children.indexOf(object3D), 1);
        }
        reactive(logic).parent = null;
        const children = reactive(object3D).children as unknown as Object3D[];
        for (let i = children.length - 1; i >= 0; i--)
        {
            getLogic(children[i]).dispose();
        }
        const r_components = reactive(object3D).components;
        for (let i = r_components.length - 1; i >= 0; i--)
        {
            const component = toRaw(r_components[i]) as unknown as Component;
            r_components.splice(i, 1);
            componentLogic(component).dispose();
        }
    }

    // 填充累积对象并返回（与 ContainerLogic 共用同一对象）
    Object.assign(logic, {
        scene,
        activeInHierarchy,
        isSelfLoaded,
        isLoaded,
        boundingBox,
        orientation,
        matrix,
        rotationMatrix,
        local2world,
        ITlocal2world,
        world2local,
        local2worldRotation,
        world2localRotation,
        worldPosition,
        beforeRender,
        dispose,
    });

    return logic;
}

registerLogic('Object3D', createObject3DLogic);

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
