import { AssetType } from '../assets/AssetType';
import { Object3D } from './Object3D';

/**
 * 创建一个默认的 Object3D 实例。
 *
 * Object3D 是纯数据接口，无法 `new`。本工厂返回满足 Object3D 接口的纯对象，
 * 包含所有默认字段值。
 *
 * @returns 新建的 Object3D 实例
 */
export function createObject3D(): Object3D
{
    return {
        __class__: 'Object3D',
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
        scene: null,
        components: [],
        children: [],
    };
}
