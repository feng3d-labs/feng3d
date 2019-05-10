namespace feng3d
{
    /**
     * 所有feng3d对象的基类
     */
    export class Feng3dObject extends EventDispatcher implements IDisposable
    {
        /**
         * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
         */
        @serialize
        hideFlags = HideFlags.None;

        /**
         * 通用唯一标识符（Universally Unique Identifier）
         */
        readonly uuid: string;

        /**
         * 是否已销毁
         */
        readonly disposed: boolean;

        /**
         * 构建
         * 
         * 新增不可修改属性 guid
         */
        constructor()
        {
            super();
            Object.defineProperty(this, "guid", { value: Math.uuid() });
            Object.defineProperty(this, "disposed", { value: false, configurable: true });
            Object.defineProperty(this, "objectMap", { value: {} });
            debuger && console.assert(!Feng3dObject.objectLib[this.uuid], `唯一标识符存在重复！？`);
            Feng3dObject.objectLib[this.uuid] = this;
        }

        /**
         * 销毁
         */
        dispose()
        {
            Object.defineProperty(this, "disposed", { value: true, configurable: false });
        }

        /**
         * 获取对象
         * 
         * @param uuid 通用唯一标识符
         */
        static getObject(uuid: string)
        {
            return this.objectLib[uuid];
        }

        /**
         * 获取对象
         * 
         * @param type 
         */
        static getObjects<T extends Feng3dObject>(type?: Constructor<T>): T[]
        {
            var objects = Object.keys(this.objectLib).map(v => this.objectLib[v]);
            //
            var filterResult = objects;
            if (type)
            {
                filterResult = objects.filter(v => v instanceof type);
            }
            return <T[]>filterResult;
        }

        /**
         * 对象库
         */
        private static objectLib: { [guid: string]: Feng3dObject };
    }
}