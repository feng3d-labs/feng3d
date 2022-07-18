namespace feng3d
{

    export interface MixinsGlobalEvents
    {
        /**
         * 图片资源发生变化
         */
        'asset.imageAssetChanged': { url: string };
        /**
         * 解析出资源
         */
        'asset.parsed': any;
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