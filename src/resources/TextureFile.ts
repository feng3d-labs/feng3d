namespace feng3d
{
    /**
     * 纹理文件
     */
    export class TextureFile extends JsonFile
    {
        /**
         * 材质
         */
        material: Texture2D;

        assetType = AssetExtension.texture;
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.texture] = TextureFile;
}