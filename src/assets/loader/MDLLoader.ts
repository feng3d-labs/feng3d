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
            assets.readString(mdlurl, (err, content) =>
            {
                war3.mdlParser.parse(content, (war3Model) =>
                {
                    war3Model.root = mdlurl.substring(0, mdlurl.lastIndexOf("/") + 1);

                    var showMesh = war3Model.getMesh();

                    var gameObject = new GameObject().value({ name: pathUtils.getName(mdlurl), children: [showMesh] })

                    feng3dDispatcher.dispatch("assets.parsed", gameObject);
                    callback && callback(gameObject);
                });
            });
        }
    }

    mdlLoader = new MDLLoader();
}