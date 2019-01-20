namespace feng3d
{

    /**
     * MD5模型加载类
     */
    export var md5Loader: MD5Loader;

    /**
     * MD5模型加载类
     */
    export class MD5Loader
    {
        /**
         * 加载资源
         * @param url   路径
         * @param completed 加载完成回调
         */
        load(url: string, completed?: (gameObject: GameObject) => void)
        {
            assets.fs.readString(url, (err, content) =>
            {
                var md5MeshData = md5MeshParser.parse(content);
                md5MeshData.name = feng3d.pathUtils.getName(url);
                md5MeshConverter.convert(md5MeshData, completed);
            });
        }

        /**
         * 加载MD5模型动画
         * @param url MD5模型动画资源路径
         * @param completed 加载完成回调
         */
        loadAnim(url: string, completed?: (animationClip: AnimationClip) => void)
        {
            assets.fs.readString(url, (err, content) =>
            {
                var md5AnimData = md5AnimParser.parse(content);
                md5AnimData.name = feng3d.pathUtils.getName(url);
                md5AnimConverter.convert(md5AnimData, completed);
            });
        }
    }
    md5Loader = new MD5Loader();


}
