import { logic, reactive } from '@feng3d/reactivity';
import type { Object3D } from "../core/Object3D";
import { Component, ComponentLogic } from './Component';
import { BehaviourLogic } from './Behaviour';

// 类型继承关系表：父类型 -> 子类型集合（用于 __type__ 匹配）
const _typeHierarchy: Record<string, Set<string>> = {
    'Component': new Set(['Component', 'Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'Script', 'SkeletonComponent', 'Camera', 'Scene', 'SkyBox', 'TransformLayout', 'Billboard', 'CartoonComponent', 'OutLineComponent', 'WireframeComponent', 'HoldSize', 'Graphics', 'Terrain']),
    'Behaviour': new Set(['Behaviour', 'RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Light', 'DirectionalLight', 'PointLight', 'SpotLight', 'Animation', 'AudioListener', 'AudioSource', 'FPSController', 'Script']),
    'RayCastable': new Set(['RayCastable', 'Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem']),
    'Renderable': new Set(['Renderable', 'MeshRenderer', 'SkinnedMeshRenderer', 'Water', 'ParticleSystem', 'Terrain']),
    'Light': new Set(['Light', 'DirectionalLight', 'PointLight', 'SpotLight']),
};

/** typeName → 对应 Logic 基类（用于 instanceof 判断动态注册的子类型） */
const _logicBaseClasses: Record<string, typeof ComponentLogic> = {
    'Component': ComponentLogic,
    'Behaviour': BehaviourLogic,
};

/**
 * 判断组件是否匹配指定类型（含子类型）。
 *
 * 先查静态类型表（快路径），未命中时通过 logic 实例 instanceof 判断
 * （支持用户动态 registerLogic 注册的子类型，如 ScriptDemo extends Script）。
 */
export function matchType(component: Component, typeName: string): boolean
{
    if (!typeName) return true;
    if (component.__type__ === typeName) return true;
    const subtypes = _typeHierarchy[typeName];
    if (subtypes && subtypes.has(component.__type__)) return true;

    // 慢路径：通过 logic instanceof 判断（支持动态注册的子类型）
    const baseClass = _logicBaseClasses[typeName];
    if (baseClass)
    {
        const l = logic(component);
        if (l instanceof baseClass) return true;
    }

    return false;
}

/**
 * 获取 Object3D 上指定类型的第一个组件。
 *
 * @param object3D 目标 Object3D
 * @param typeName 组件类型名（__type__）
 */
export function getComponent<T extends Component>(object3D: Object3D, typeName: string): T
{
    return logic(object3D).getComponent<T>(typeName);
}

/**
 * 获取 Object3D 上所有匹配类型的组件。
 */
export function getComponents<T extends Component>(object3D: Object3D, typeName: string, results: T[] = []): T[]
{
    return logic(object3D).getComponents<T>(typeName, results);
}

/**
 * 在自身及子孙中查找指定类型的第一个组件。
 */
export function getComponentInChildren<T extends Component>(object3D: Object3D, typeName: string, includeInactive = false): T
{
    const component = getComponent<T>(object3D, typeName);
    if (component) return component;

    const r_children = reactive(object3D).children as unknown as Object3D[];
    for (const r_child of r_children)
    {
        const child = r_child as unknown as Object3D;
        // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
        if (!includeInactive && !logic(child).activeSelf) continue;
        const found = getComponentInChildren<T>(child, typeName, includeInactive);
        if (found) return found;
    }

    return null;
}

/**
 * 在自身及子孙中查找所有匹配类型的组件。
 */
export function getComponentsInChildren<T extends Component>(object3D: Object3D, typeName: string, includeInactive = false, results: T[] = []): T[]
{
    getComponents(object3D, typeName, results);

    const r_children = reactive(object3D).children as unknown as Object3D[];
    for (const r_child of r_children)
    {
        const child = r_child as unknown as Object3D;
        // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
        if (!includeInactive && !logic(child).activeSelf) continue;
        getComponentsInChildren(child, typeName, includeInactive, results);
    }

    return results;
}

/**
 * 在自身及父级中查找指定类型的第一个组件。
 */
export function getComponentInParent<T extends Component>(object3D: Object3D, typeName: string, includeInactive = false): T
{
    // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
    if (includeInactive || logic(object3D).activeSelf)
    {
        const component = getComponent<T>(object3D, typeName);
        if (component) return component;
    }
    let r_parent = logic(object3D).parent as Object3D | null;
    while (r_parent)
    {
        const parent = r_parent as Object3D;
        if (includeInactive || logic(parent).activeSelf)
        {
            const c = parent.components.find(c => matchType(c, typeName)) as T;
            if (c) return c;
        }
        r_parent = logic(parent).parent as Object3D | null;
    }

    return null;
}

/**
 * 在自身及父级中查找所有匹配类型的组件。
 */
export function getComponentsInParent<T extends Component>(object3D: Object3D, typeName: string, includeInactive = false, results: T[] = []): T[]
{
    // 通过 logic().activeSelf 读取，使 JSON 字面量（缺失字段）能拿到默认值 true
    if (includeInactive || logic(object3D).activeSelf)
    {
        getComponents(object3D, typeName, results);
    }
    let r_parent = logic(object3D).parent as Object3D | null;
    while (r_parent)
    {
        const parent = r_parent as Object3D;
        if (includeInactive || logic(parent).activeSelf)
        {
            for (const c of parent.components)
            {
                if (!typeName || matchType(c, typeName)) results.push(c as T);
            }
        }
        r_parent = logic(parent).parent as Object3D | null;
    }

    return results;
}
