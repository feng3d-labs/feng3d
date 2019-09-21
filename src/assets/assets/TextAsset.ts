namespace feng3d
{
    export class TextAsset extends StringAsset
    {
        static extenson = ".txt";

        assetType = AssetType.txt;

        textContent: string;

        initAsset()
        {
            this.textContent = this.textContent || "";
        }
    }
}