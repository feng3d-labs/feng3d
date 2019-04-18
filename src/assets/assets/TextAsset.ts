namespace feng3d
{
    export class TextAsset extends StringAsset
    {
        static extenson = ".txt";

        assetType = AssetType.txt;

        textContent: string;

        createData()
        {
            this.textContent = "";
        }
    }
}