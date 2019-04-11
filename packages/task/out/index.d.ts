declare module '@feng3d/task' {
    export = feng3d;
}
declare namespace feng3d {
    /**
  * 任务，用于处理任务之间依赖
  */
    var task: Task;
    /**
     * 任务函数
     */
    interface TaskFunction {
        /**
         * 函数自身名称
         */
        readonly name?: string;
        /**
         * 函数自身
         */
        (callback: () => void): void;
    }
    /**
     * 任务
     *
     * 处理 异步任务(函数)串联并联执行功能
     */
    class Task {
        /**
         * 并联多个异步函数为一个函数
         *
         * 这些异步函数同时执行
         *
         * @param fns 一组异步函数
         */
        parallel(fns: TaskFunction[]): TaskFunction;
        /**
         * 串联多个异步函数为一个函数
         *
         * 这些异步函数按顺序依次执行，等待前一个异步函数执行完调用回调后才执行下一个异步函数。
         *
         * @param fns 一组异步函数
         */
        series(fns: TaskFunction[]): TaskFunction;
        /**
         * 创建一组并行同类任务，例如同时加载一组资源，并在回调中返回结果数组
         *
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        parallelResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void): void;
        /**
         * 创建一组串联同类任务，例如排序加载一组资源
         *
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        seriesResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void): void;
    }
}
//# sourceMappingURL=index.d.ts.map