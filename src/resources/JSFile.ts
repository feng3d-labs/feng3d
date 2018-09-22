namespace feng3d
{
    export class JSFile extends Feng3dFile
    {
        assetType = AssetExtension.js;

        jsContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.jsContent, callback);
        }
    }
}