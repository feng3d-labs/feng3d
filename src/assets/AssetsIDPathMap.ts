namespace feng3d
{
    /**
     * 资源编号与路径映射
     */
    export var assetsIDPathMap: AssetsIDPathMap;

    /**
     * 资源编号与路径映射
     */
    export class AssetsIDPathMap
    {
        /**
         * 编号映射到路径
         */
        private _IDToPath: { [id: string]: string } = {};

        /**
         * 路径映射到编号
         */
        private _PathToID: { [path: string]: string } = {};

        /**
         * 初始化
         * 
         * @param map 资源编号到路径映射
         */
        init(map?: { [id: string]: string })
        {
            this._IDToPath = {};
            this._PathToID = {};
            if (!map) return;
            Object.keys(map).forEach(id =>
            {
                this.addIDPathMap(id, map[id]);
            })
        }

        /**
         * 获取所有资源编号列表
         */
        getAllIDs()
        {
            return Object.keys(this._IDToPath);
        }

        /**
         * 获取所有资源路径列表
         */
        getAllPaths()
        {
            return Object.keys(this._PathToID);
        }

        /**
         * 获取资源路径
         * 
         * @param id 资源编号
         */
        getPath(id: string)
        {
            return this._IDToPath[id];
        }

        /**
         * 获取资源编号
         * 
         * @param path 资源路径
         */
        getID(path: string)
        {
            return this._PathToID[path];
        }

        /**
         * 新增资源编号路径映射
         * 
         * @param id 资源编号
         * @param path 资源路径
         */
        addIDPathMap(id: string, path: string)
        {
            feng3d.assert(!this._IDToPath[id], `无法新增已存在指定编号资源映射`);
            feng3d.assert(!this._PathToID[path], `无法新增已存在指定路径资源映射`);

            this._IDToPath[id] = path;
            this._PathToID[path] = id;
        }

        /**
         * 删除指定编号映射
         * 
         * @param id 编号
         */
        deleteByID(id: string)
        {
            var path = this._IDToPath[id]
            assert(!!path, `无法删除不存在编号资源映射`);
            assert(!!this._PathToID[path], `无法删除不存在路径资源映射`);

            delete this._IDToPath[id];
            delete this._PathToID[path];
        }

        /**
         * 删除指定路径资源映射
         * 
         * @param path 资源编号
         */
        deleteByPath(path: string)
        {
            var id = this._PathToID[path]
            assert(!!id, `无法删除不存在路径资源映射`);
            assert(!!this._IDToPath[id], `无法删除不存在编号资源映射`);

            delete this._IDToPath[id];
            delete this._PathToID[path];
        }
    }

    assetsIDPathMap = new AssetsIDPathMap();
}