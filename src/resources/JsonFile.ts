namespace feng3d
{
    export class JsonFile extends Feng3dFile
    {
        assetType = AssetExtension.json;

        jsonContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.jsonContent, callback);
        }
    }
}