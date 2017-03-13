module feng3d
{
    /**
     * 可序列化对象
     */
    export interface Serializable
    {
        /**
         * 保存为数据
         */
        saveToData();

        /**
         * 从数据初始化
         */
        initFromData();
    }
}