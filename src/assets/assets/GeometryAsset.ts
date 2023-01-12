import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { Geometry } from '../../3d/geometrys/Geometry';
import { CubeGeometry } from '../../3d/primitives/CubeGeometry';
import { oav } from '../../objectview/ObjectView';
import { ObjectAsset } from '../ObjectAsset';

declare module '../../core/assets/FileAsset' { interface AssetMap { GeometryAsset: GeometryAsset; } }

/**
 * 几何体资源
 */
@RegisterAsset('GeometryAsset')
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
