namespace feng3d
{
    /**
     * feng3d 资源文件
     */
    export class Feng3dFile extends Feng3dAssets
    {
        @oav({ exclude: true })
        name: string;

        /**
         * 资源名称
         */
        @oav()
        get assetName()
        {
            if (!this.assetsPath) return "";
            return pathUtils.getName(this.assetsPath);
        }
    }
}