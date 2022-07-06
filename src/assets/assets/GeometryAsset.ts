namespace feng3d
{
    /**
     * 几何体资源
     */
    export class GeometryAsset extends ObjectAsset
    {
        static extenson = ".json";

        /**
         * 几何体
         */
        @oav({ component: "OAVObjectView" })
        data: Geometry;

        assetType = AssetType.geometry;

        initAsset()
        {
            this.data = this.data || new CubeGeometry();
            this.data.assetId = this.data.assetId || this.assetId;
        }
    }

    export interface AssetTypeClassMap
    {
        "geometry": new () => GeometryAsset;
    }
    setAssetTypeClass("geometry", GeometryAsset);
}