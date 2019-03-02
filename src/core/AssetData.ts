namespace feng3d
{
    /**
     * 资源数据
     * 
     * 该对象可由资源文件中读取，或者保存为资源
     */
    export class AssetData extends Feng3dObject
    {
        /**
         * 资源名称
         */
        name: string;

        /**
         * 资源编号
         */
        readonly assetId: string;

        /**
         * 资源类型，由具体对象类型决定
         */
        readonly assetType: AssetType;
    }
}