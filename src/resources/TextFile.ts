namespace feng3d
{
    export class TextFile extends Feng3dFile
    {
        assetType = AssetExtension.txt;

        textContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.textContent, callback);
        }
    }
}