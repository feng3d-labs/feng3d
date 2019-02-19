namespace feng3d
{
    /**
     * Obj模型加载类
     */
    export var objLoader: ObjLoader;

    /**
     * Obj模型加载类
     */
    export class ObjLoader
    {
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (gameObject: GameObject) => void)
        {
            var root = url.substring(0, url.lastIndexOf("/") + 1);

            assets.fs.readString(url, (err, content) =>
            {
                var objData = objParser.parser(content);
                objData.name = feng3d.pathUtils.getName(url);
                var mtl = objData.mtl;
                if (mtl)
                {
                    mtlLoader.load(root + mtl, (err, materials) =>
                    {
                        objConverter.convert(objData, materials, completed);
                    });
                } else
                {
                    objConverter.convert(objData, null, completed);
                }
            });
        }
    }

    objLoader = new ObjLoader();
}