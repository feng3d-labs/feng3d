import { AssetType, setAssetTypeClass } from "@feng3d/core";
import { TextAsset } from "./TextAsset";

/**
 * JS资源
 */
export class JSAsset extends TextAsset
{
    static extenson = ".js";

    assetType = AssetType.js;

    textContent: string;

    initAsset()
    {
        this.textContent = this.textContent || "";
    }
}
setAssetTypeClass("js", JSAsset);
