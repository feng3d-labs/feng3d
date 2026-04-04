import { AssetType, CubeGeometry, Geometry } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { RegisterAsset } from '../FileAsset';
import { ObjectAsset } from './ObjectAsset';

declare module '../FileAsset' { interface AssetMap { GeometryAsset: GeometryAsset; } }

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
