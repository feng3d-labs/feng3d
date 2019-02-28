namespace feng3d
{
    export class TextFile extends StringFile
    {
        assetType = AssetExtension.txt;

        extenson = ".txt";

        textContent = "";
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.txt] = TextFile;
}