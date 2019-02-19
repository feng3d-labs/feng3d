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
        private _idMap: { [id: string]: { id: string, path: string, isDirectory: boolean } } = {};

        /**
         * 路径映射到编号
         */
        private _pathMap: { [path: string]: { id: string, path: string, isDirectory: boolean } } = {};

        /**
         * 初始化
         * 
         * @param list 资源列表
         */
        init(list?: { id: string, path: string, isDirectory: boolean }[])
        {
            this._idMap = {};
            this._pathMap = {};
            if (!list) return;

            list.forEach(item =>
            {
                this.addItem(item);
            })
        }

        /**
         * 获取所有资源编号列表
         */
        getAllIDs()
        {
            return Object.keys(this._idMap);
        }

        /**
         * 获取所有资源路径列表
         */
        getAllPaths()
        {
            return Object.keys(this._pathMap);
        }

        /**
         * 获取资源路径
         * 
         * @param id 资源编号
         */
        getPath(id: string)
        {
            return this._idMap[id] && this._idMap[id].path;
        }

        /**
         * 获取资源编号
         * 
         * @param path 资源路径
         */
        getID(path: string)
        {
            return this._pathMap[path] && this._pathMap[path].id;
        }

        /**
         * 是否存在指定编号的资源
         * 
         * @param id 资源编号
         */
        existID(id: string)
        {
            return !!this._idMap[id];
        }

        /**
         * 是否存在指定路径的资源
         * 
         * @param path 资源路径
         */
        existPath(path: string)
        {
            return !!this._pathMap[path];
        }

        /**
         * 新增资源编号路径映射
         * 
         * @param item 资源编号
         * @param path 资源路径
         */
        addItem(item: { id: string, path: string, isDirectory: boolean })
        {
            feng3d.assert(!this._idMap[item.id], `无法新增已存在指定编号资源映射`);
            feng3d.assert(!this._pathMap[item.path], `无法新增已存在指定路径资源映射`);

            this._idMap[item.id] = item;
            this._pathMap[item.path] = item;
        }

        /**
         * 删除指定编号映射
         * 
         * @param id 编号
         */
        deleteByID(id: string)
        {
            var item = this._idMap[id];
            assert(!!item, `无法删除不存在编号资源映射`);

            delete this._idMap[id];
            delete this._pathMap[item.path];
        }

        /**
         * 删除指定路径资源映射
         * 
         * @param path 资源编号
         */
        deleteByPath(path: string)
        {
            var item = this._pathMap[path]
            assert(!!item, `无法删除不存在路径资源映射`);

            delete this._idMap[item.id];
            delete this._pathMap[path];
        }

        /**
         * 输出为列表
         */
        toList()
        {
            var list = Object.keys(this._idMap).map(id => this._idMap[id]);
            return list;
        }
    }

    assetsIDPathMap = new AssetsIDPathMap();
}