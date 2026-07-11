import { AssetType } from '../assets/AssetType';
import { Object3D } from './Object3D';
import { logic, registerDefaults } from '@feng3d/reactivity';

/**
 * Object3D 默认值模板。
 *
 * 供 `createObject3D()` 工厂与 `logic()` 自动填充共用。
 * 通过 registerDefaults 注册后，JSON 对象字面量形式声明 Object3D 时可省略这些字段。
 */
export const object3DDefaults = {
    __type__: 'Object3D',
    name: 'Object3D',
    tag: '',
    mouseEnabled: true,
    activeSelf: true,
    assetType: AssetType.object3D,
    assetId: '',
    prefabId: '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    components: [] as any[],
    children: [] as any[],
};

// 注册默认值（缺失字段自动填充）
registerDefaults('Object3D', object3DDefaults);

/**
 * 创建一个默认的 Object3D 实例。
 *
 * Object3D 是纯数据接口，无法 `new`。本工厂返回满足 Object3D 接口的纯对象，
 * 包含所有默认字段值（浅拷贝 object3DDefaults，避免共享引用）。
 *
 * @returns 新建的 Object3D 实例
 */
export function createObject3D(): Object3D
{
    return {
        ...object3DDefaults,
        position: { ...object3DDefaults.position },
        rotation: { ...object3DDefaults.rotation },
        scale: { ...object3DDefaults.scale },
        components: [...object3DDefaults.components],
        children: [...object3DDefaults.children],
    } as Object3D;
}
