namespace feng3d
{
    /**
     * 着色器 资源
     */
    export class ShaderAsset extends ScriptAsset
    {
        static extenson = ".ts";

        assetType = AssetType.shader;
    }

    export interface AssetTypeClassMap
    {
        "shader": new () => ShaderAsset;
    }
    setAssetTypeClass("shader", ShaderAsset);
}