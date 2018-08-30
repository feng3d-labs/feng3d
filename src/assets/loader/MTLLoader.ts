namespace feng3d
{
    /**
     * OBJ模型MTL材质加载器
     */
    export var mtlLoader: MTLLoader;

    /**
     * OBJ模型MTL材质加载器
     */
    export class MTLLoader
    {
        /**
         * 加载MTL材质
         * @param path MTL材质文件路径
         * @param callback 加载完成回调
         */
        load(path: string, callback: (err: Error, materials: { [name: string]: Material; }) => void)
        {
            assets.readFileAsString(path, (err, content) =>
            {
                if (err)
                {
                    callback(err, null);
                    return;
                }
                var mtlData = mtlParser.parser(content);
                var materials = mtlConverter.convert(mtlData);
                callback(null, materials);
            });
        }
    }

    mtlLoader = new MTLLoader();
}