import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { Geometry } from '../../core/geometry/Geometry';
import { CubeGeometry } from '../../core/primitives/CubeGeometry';
import { oav } from '../../objectview/ObjectView';
import { serializable } from '../../serialization/serializable';
import { ObjectAsset } from '../ObjectAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'geometry': new () => GeometryAsset;
    }
}

/**
 * 几何体资源
 */
@serializable()
export class GeometryAsset extends ObjectAsset
{
    static extenson = '.json';

    /**
     * 几何体
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Geometry;

    assetType = AssetType.geometry;

    initAsset()
    {
        this.data = this.data || new CubeGeometry();
        this.data.assetId = this.data.assetId || this.assetId;
    }
}

setAssetTypeClass('geometry', GeometryAsset);
