namespace feng3d
{
    export class ShaderFile extends Feng3dFile
    {
        assetType = AssetExtension.shader;

        shaderContent: string;

        protected saveFile(readWriteAssets: ReadWriteAssets, callback?: (err: Error) => void)
        {
            readWriteAssets.writeString(this.filePath, this.shaderContent, callback);
        }
    }
}