export { };
declare global
{
    export interface MixinsGlobalEvents
    {
        /**
         * shader资源发生变化
         */
        'asset.shaderChanged': unknown;

        /**
         * 脚本发生变化
         */
        'asset.scriptChanged': unknown;
        /**
         * 图片资源发生变化
         */
        'asset.imageAssetChanged': { url: string };
        /**
         * 解析出资源
         */
        'asset.parsed': unknown;
        /**
         * 删除文件
         */
        'fs.delete': string;
        /**
         * 写文件
         */
        'fs.write': string;
    }
}
