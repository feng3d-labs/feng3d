import { AssetType, setAssetTypeClass, TextureCube } from "@feng3d/core";
import { oav } from "@feng3d/objectview";
import { ObjectAsset } from "../ObjectAsset";

/**
 * 立方体纹理资源
 */
export class TextureCubeAsset extends ObjectAsset
{
    static extenson = ".json";

    /**
     * 材质
     */
    @oav({ component: "OAVObjectView" })
    data: TextureCube;

    assetType = AssetType.texturecube;

    initAsset()
    {
        this.data = this.data || new TextureCube();
    }
}

setAssetTypeClass("texturecube", TextureCubeAsset);
