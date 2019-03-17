namespace feng3d
{
    /**
     * 任务状态
     */
    export enum TaskStatus
    {
        /**
         * 初始状态，未开始
         */
        None,
        /**
         * 等待状态，等待到依赖任务执行完成
         */
        Waiting,
        /**
         * 执行状态，进行中
         */
        Doing,
        /**
         * 完成状态，已完成
         */
        Done,
    }

    /**
     * 任务函数
     */
    export interface TaskFunction
    {
        (done: (error?: Error) => void): void;
    }

    /**
     * 任务，用于处理多件可能有依赖或者嵌套的事情
     */
    export class Task
    {
        /**
         * 默认初始状态，未开始，状态不可逆
         */
        status = TaskStatus.None;

        /**
         * 任务自身内容回调带回结果
         */
        result: any;

        /**
         * 构建任务
         * 
         * @param content 任务自身内容，回调带回结果保存在 result.value 中
         * @param preTasks 前置任务列表
         */
        constructor(private content?: (callback: (result?: any) => void) => void, private preTasks?: Task[])
        {
            this.preTasks = this.preTasks || [];
            this.content = this.content || ((callback: () => void) => { callback(); });
        }

        do(callback?: () => void)
        {
            if (this.status == TaskStatus.Done) { callback && callback(); return; }

            // 回调添加到完成事件中
            if (callback) this.once("done", callback);

            // 任务正在执行 直接返回
            if (this.status == TaskStatus.Doing) return;

            if (this.status == TaskStatus.Waiting)
            {
                //判断是否出现等待死锁；例如A前置任务为B，B前置任务为A
                var waitings = this.preTasks.filter(v => v.status == TaskStatus.Waiting);
                var index = 0;
                while (index < waitings.length)
                {
                    var item = waitings[index];
                    if (item == this)
                    {
                        console.log(waitings.slice(0, index + 1));
                        feng3d.error(`出现循环引用任务`)
                        return;
                    }
                    waitings = waitings.concat(item.preTasks.filter(v => v.status == TaskStatus.Waiting));
                    index++;
                }
                return;
            }

            // 执行前置任务函数
            var doPreTasks = (callback: () => void) =>
            {
                var preTasks = (this.preTasks || []).concat();
                var waitNum = preTasks.length;
                if (waitNum == 0) callback();
                preTasks.forEach(v => v.once("done", () =>
                {
                    waitNum--;
                    if (waitNum == 0) callback();
                }));
                preTasks.forEach(v => v.do());
            };

            this.status = TaskStatus.Waiting;

            // 执行前置任务
            doPreTasks(() =>
            {
                this.status = TaskStatus.Doing;

                // 执行任务自身
                this.content((result) =>
                {
                    this.status = TaskStatus.Done;
                    this.result = result;
                    event.dispatch(this, "done");
                });
            });
        }

        /**
         * 监听一次事件后将会被移除
		 * @param type						事件的类型。
		 * @param listener					处理事件的侦听器函数。
		 * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends "done">(type: K, listener: (event: Event<any>) => void, thisObject?: any, priority?: number)
        {
            event.on(this, type, listener, thisObject, priority, true);
        }

        /**
         * 创建一组并行同类任务，例如同时加载一组资源
         * 
         * @param params 一组参数
         * @param taskFunc 单一任务函数
         * @param onComplete 完成回调
         */
        static parallel<P, R>(params: P[], taskFunc: (param: P, callback: (result: R) => void) => void, onComplete: (results: R[]) => void)
        {
            // 构建一组任务
            var preTasks = params.map(p =>
            {
                return new Task((callback) => { taskFunc(p, callback); });
            });
            var task = new Task(null, preTasks);
            // 完成时提取结果
            task.once("done", (e) =>
            {
                var results = task.preTasks.map(v => v.result);
                onComplete(results);
            });
            return task;
        }

        /**
         * 创建一组串联同类任务，例如排序加载一组资源
         * 
         * @param params 一组参数
         * @param taskFunc 单一任务函数
         * @param onComplete 完成回调
         */
        static series<P, R>(params: P[], taskFunc: (param: P, callback: (result: R) => void) => void, onComplete: (results: R[]) => void)
        {
            // 构建一组任务
            var preTasks = params.map(p =>
            {
                return new Task((callback) => { taskFunc(p, callback); });
            });
            // 串联任务
            preTasks.forEach((v, i, arr) => { if (i > 0) arr[i].preTasks = [arr[i - 1]]; });
            // 
            var task = new Task(null, preTasks);
            // 完成时提取结果
            task.once("done", (e) =>
            {
                var results = task.preTasks.map(v => v.result);
                onComplete(results);
            });
            return task;
        }

        /**
         * 创建一组并行任务，所有任务同时进行
         * 
         * @param taskFuncs 任务函数列表
         * @param onComplete 完成回调
         */
        static parallelTask(taskFuncs: TaskFunction[], onComplete: () => void)
        {
            // 构建一组任务
            var preTasks = taskFuncs.map(v => new Task(v));
            var task = new Task(null, preTasks);
            // 完成时提取结果
            task.once("done", onComplete);
            return task;
        }

        /**
         * 创建一组串联任务，只有上个任务完成后才执行下个任务
         * 
         * @param taskFuncs 任务函数列表
         * @param onComplete 完成回调
         */
        static seriesTask(taskFuncs: TaskFunction[], onComplete: () => void)
        {
            // 构建一组任务
            var preTasks = taskFuncs.map(v => new Task(v));
            // 串联任务
            preTasks.forEach((v, i, arr) => { if (i > 0) arr[i].preTasks = [arr[i - 1]]; });
            var task = new Task(null, preTasks);
            // 完成时提取结果
            task.once("done", onComplete);
            return task;
        }

        static testParallel()
        {
            this.parallel([1, 2, 3, 4, 5], (p, callback: (r: number) => void) =>
            {
                callback(p);
            }, (rs) =>
                {
                    console.log(rs);
                }).do();
        }

        static test()
        {
            var starttime = Date.now();
            var task = new feng3d.Task();
            task.preTasks = ["https://www.tslang.cn/docs/handbook/gulp.html", "https://www.baidu.com/s?ie=utf-8&f=3&rsv_bp=0&rsv_idx=1&tn=baidu&wd=typescript&rsv_pq=d9a9ff640009fa54&rsv_t=b4c0a9U66FHSonWRPWnDU%2B1spxVJyiTo0ydjnB1LU994vtRz09x5KB2kOi8&rqlang=cn&rsv_enter=1&rsv_sug3=5&rsv_sug1=5&rsv_sug7=100&rsv_sug2=0&prefixsug=types&rsp=1&inputT=1972&rsv_sug4=1973&rsv_sug=1",
                "https://www.baidu.com"].map(v =>
                {
                    var t = new feng3d.Task();
                    t.content = (callback) =>
                    {
                        var sleep = 5000 * Math.random();
                        sleep = ~~sleep;
                        setTimeout(() =>
                        {
                            callback(sleep)
                        }, sleep);
                    };
                    return t;
                });
            task.preTasks.forEach((v, i, arr) => { if (i > 0) arr[i].preTasks = [arr[i - 1]]; })
            task.do(() =>
            {
                var result = task.preTasks.map(v => v.result);
                console.log(`消耗时间 ${Date.now() - starttime}， 子任务分别消耗 ${result.toString()}`);
                console.log("succeed");
            });
        }

        static testSeries()
        {
            var task = this.series(["tsconfig.json", "index.html",
                "app.js"], (p, callback) =>
                {
                    fs.readString(p, (err, str) =>
                    {
                        callback(str);
                    });
                }, (results: string[]) =>
                {
                    console.log(`消耗时间 ${Date.now() - starttime}`);
                    console.log("succeed");
                    console.log(`结果:`);
                    console.log(results);
                });

            var starttime = Date.now();
            task.do();
        }

        static testParallelTask()
        {
            console.time(`task`);
            // console.timeStamp(`task`);
            var funcs: TaskFunction[] = [1, 2, 3, 4].map(v => (callback) =>
            {
                var sleep = 5000 * Math.random();
                sleep = ~~sleep;
                console.time(`${sleep}`);
                setTimeout(() =>
                {
                    console.log(v);
                    console.timeEnd(`${sleep}`);
                    callback();
                }, sleep);
            });
            this.parallelTask(funcs, () =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            }).do();

        }

        static testSeriesTask()
        {
            console.time(`task`);
            // console.timeStamp(`task`);
            var funcs: TaskFunction[] = [1, 2, 3, 4].map(v => (callback) =>
            {
                var sleep = 5000 * Math.random();
                sleep = ~~sleep;
                console.time(`${sleep}`);
                setTimeout(() =>
                {
                    console.log(v);
                    console.timeEnd(`${sleep}`);
                    callback();
                }, sleep);
            });
            this.seriesTask(funcs, () =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            }).do();

        }

    }
}