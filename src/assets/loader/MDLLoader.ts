namespace feng3d
{
    /**
     * MDL模型加载器
     */
    export var mdlLoader: MDLLoader;

    /**
     * MDL模型加载器
     */
    export class MDLLoader
    {
        /**
         * 加载MDL模型
         * @param mdlurl MDL模型路径
         * @param callback 加载完成回调
         */
        load(mdlurl: string, callback?: (gameObject: GameObject) => void)
        {
            assets.fs.readString(mdlurl, (err, content) =>
            {
                war3.mdlParser.parse(content, (war3Model) =>
                {
                    var showMesh = war3Model.getMesh();

                    var gameObject = Object.setValue(new GameObject(), { name: pathUtils.getName(mdlurl), children: [showMesh] })

                    feng3dDispatcher.dispatch("assets.parsed", gameObject);
                    callback && callback(gameObject);
                });
            });
        }
    }

    mdlLoader = new MDLLoader();
}