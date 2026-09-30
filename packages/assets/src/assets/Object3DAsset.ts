import { AssetType, reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface Object3DAsset
{
    getAssetData(): Promise<Object3D>;
}

/**
 * 游戏对象资源
 */
@decoratorRegisterClass()
export class Object3DAsset extends ObjectAsset
{
    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Object3D;

    assetType = AssetType.object3D;

    /**
     * 文件后缀（issue #40 的后缀约定：保留 `.json` 并在前面加类型标记）
     *
     * 对象资源的内容是一棵不含 `Scene` 组件的 `Object3D` 树，后缀须为 `.gameobject.json`，
     * 编辑器与工具据此按后缀识别资源类型（`packages/editor/src/ui/assets/Object3DAssetFile.ts`
     * 的 `GAMEOBJECT_ASSET_FILE_EXT`，守卫见 `test/resourceFormatGuard.spec.ts`）。
     */
    static extenson = '.gameobject.json';

    initAsset()
    {
        this.data = this.data || ({ __type__: 'Object3D' } as Object3D);
        reactive(this.data).assetId = this.data.assetId || this.assetId;
    }

    protected _getAssetData()
    {
        const object3D = serialization.clone(this.data);
        delete reactive(object3D).assetId;
        reactive(object3D).prefabId = this.assetId;

        return object3D;
    }
}
