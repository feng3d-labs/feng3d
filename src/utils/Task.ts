namespace feng3d
{
    /**
     * 任务，用于处理任务之间依赖
     */
    export var task: Task;

    /**
     * 任务函数
     */
    export interface TaskFunction
    {
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
    class Task
    {
        /**
         * 并联多个异步函数为一个函数
         * 
         * 这些异步函数同时执行
         * 
         * @param fns 一组异步函数
         */
        parallel(fns: TaskFunction[]): TaskFunction
        {
            var result: TaskFunction = (callback) =>
            {
                if (fns.length == 0) { callback(); return; }
                var index = 0;
                fns.forEach(fn =>
                {
                    var callbackNum = 0;
                    fn(() =>
                    {
                        callbackNum++;
                        if (callbackNum == 1)
                        {
                            index++;
                            if (index == fns.length)
                            {
                                callback();
                            }
                        }
                        else { console.warn(`${fn.name ? "函数" + fn.name : "匿名函数"} 多次调用回调函数，当前次数 ${callbackNum}`); }
                    });
                });
            };
            return result;
        }

        /**
         * 串联多个异步函数为一个函数
         * 
         * 这些异步函数按顺序依次执行，等待前一个异步函数执行完调用回调后才执行下一个异步函数。
         * 
         * @param fns 一组异步函数
         */
        series(fns: TaskFunction[]): TaskFunction
        {
            var result: TaskFunction = (callback) =>
            {
                if (fns.length == 0) { callback(); return; }
                var index = 0;
                var next = () =>
                {
                    var fn = fns[index];
                    var callbackNum = 0;
                    fn(() =>
                    {
                        callbackNum++;
                        if (callbackNum == 1)
                        {
                            index++;
                            if (index < fns.length)
                            {
                                next();
                            } else
                            {
                                callback && callback();
                            }
                        }
                        else { console.warn(`${fn.name ? "函数" + fn.name : "匿名函数"} 多次调用回调函数，当前次数 ${callbackNum}`); }
                    });
                }
                next();
            };
            return result;
        }

        /**
         * 创建一组并行同类任务，例如同时加载一组资源，并在回调中返回结果数组
         * 
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        parallelResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void)
        {
            var map = new Map();
            // 包装函数
            var fns = ps.map(p => (callback: () => void) =>
            {
                fn(p, r =>
                {
                    map.set(p, r);
                    callback();
                });
            });
            this.parallel(fns)(() =>
            {
                var results = ps.map(p =>
                {
                    return map.get(p);
                });
                map.clear();
                done(results);
            });
        }

        /**
         * 创建一组串联同类任务，例如排序加载一组资源
         * 
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        seriesResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void)
        {
            var map = new Map();
            // 包装函数
            var fns = ps.map(p => (callback: () => void) =>
            {
                fn(p, r =>
                {
                    map.set(p, r);
                    callback();
                });
            });
            this.series(fns)(() =>
            {
                var results = ps.map(p =>
                {
                    return map.get(p);
                });
                map.clear();
                done(results);
            });
        }
    }

    task = new Task();
}