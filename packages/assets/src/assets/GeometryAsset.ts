import { AssetType, Geometry } from 'feng3d';
import { setAssetTypeClass } from '../FileAsset';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
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
@decoratorRegisterClass()
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
        this.data = this.data || ({ __type__: 'CubeGeometry' } as Geometry);
    }
}

setAssetTypeClass('geometry', GeometryAsset);
