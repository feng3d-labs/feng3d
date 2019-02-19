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
         * @param completed 加载完成回调
         */
        load(path: string, completed?: (err: Error, materials: { [name: string]: Material; }) => void)
        {
            assets.fs.readString(path, (err, content) =>
            {
                if (err)
                {
                    completed(err, null);
                    return;
                }
                var mtlData = mtlParser.parser(content);
                mtlConverter.convert(mtlData, completed);
            });
        }
    }

    mtlLoader = new MTLLoader();
}