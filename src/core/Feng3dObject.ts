namespace feng3d
{
    /**
     * 所有feng3d对象的基类
     */
    export class Feng3dObject extends EventDispatcher
    {
        /**
         * 隐藏标记，用于控制是否在层级面板、检查器显示，是否保存
         */
        hideFlags = HideFlags.None;

        /**
         * 设置对象值
         * @param v 对象对于的Object值
         */
        value(v: gPartial<this>)
        {
            feng3d.serialization.setValue(this, <any>v);
            return this;
        }
    }
}