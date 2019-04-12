declare module '@feng3d/debug' {
    export = feng3d;
}
declare namespace feng3d {
    /**
     * 调试工具
     */
    var debug: Debug;
    /**
     * 调试工具
     */
    class Debug {
        /**
         * 是否开启调试
         */
        debuger: boolean;
        constructor();
        /**
         * 测试代码运行时间
         * @param fn 被测试的方法
         * @param labal 标签
         */
        time(fn: Function, labal?: string): void;
    }
}
//# sourceMappingURL=index.d.ts.map