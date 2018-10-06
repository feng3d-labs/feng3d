namespace feng3d
{
    /**
     * 运行环境枚举
     */
    export enum RunEnvironment
    {
        /**
         * 在feng3d模式下运行
         */
        feng3d = 1 << 0,

        /**
         * 运行在编辑器中
         */
        editor = 1 << 1,

        /**
         * 在所有环境中运行
         */
        all = (1 << 8) - 1,
    }
}