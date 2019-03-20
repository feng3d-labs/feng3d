namespace feng3d
{
    /**
     * 任务，用于处理任务之间依赖
     */
    export var task: Task;

    /**
     * 任务函数
     */
    interface TaskFunction
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
    }

    task = new Task();
}