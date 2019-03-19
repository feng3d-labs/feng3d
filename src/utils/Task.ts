namespace feng3d
{
    /**
     * 任务，用于处理任务之间依赖
     */
    export var task: Task;

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
        /**
         * 默认初始状态，未开始，状态不可逆
         */
        status?: TaskStatus;

        /**
         * 任务自身内容回调带回结果
         */
        result?: any;

        /**
         * 前置任务列表
         */
        preTasks?: TaskFunction[]

        /**
         * 任务函数自身
         */
        (done: (result?: any) => void): void;
    }

    export interface TF
    {
        (callback: () => void): void;
    }

    /**
     * 串联
     * @param fns 
     */
    export function parallel(fns: TF[]): TF
    {
        var result = (callback) =>
        {
            var index = 0;

            var next = (callback) =>
            {
                if (index >= fns.length)
                {
                    callback && callback();
                    return;
                }
                var fn = fns[index];
                index++;
                fn(() =>
                {
                    next(callback);
                });
            }
            next(callback);
        };
        return result;
    }

    /**
     * 串联
     * @param fns 
     */
    export function series(fns: TF[]): TF
    {
        var result = (callback) =>
        {
            var index = 0;
            var next = (callback) =>
            {
                if (index >= fns.length)
                {
                    callback && callback();
                    return;
                }
                var fn = fns[index];
                index++;
                fn(() =>
                {
                    next(callback);
                });
            }
            next(callback);
        };
        return result;
    }

    /**
     * 执行任务
     * 
     * @param done 完成回调
     */
    function doTask(task: TaskFunction, done?: () => void)
    {
        if (task.status == TaskStatus.Done) { done && done(); return; }

        // 回调添加到完成事件中
        if (done) event.once(task, "done", done);

        // 任务正在执行 直接返回
        if (task.status == TaskStatus.Doing) return;

        if (task.status == TaskStatus.Waiting)
        {
            //判断是否出现等待死锁；例如A前置任务为B，B前置任务为A
            var waitings = task.preTasks.filter(v => v.status == TaskStatus.Waiting);
            var index = 0;
            while (index < waitings.length)
            {
                var item = waitings[index];
                if (item == task)
                {
                    console.log(waitings.slice(0, index + 1));
                    feng3d.error(`出现循环引用任务`)
                    return;
                }
                if (item.preTasks)
                    waitings = waitings.concat(item.preTasks.filter(v => v.status == TaskStatus.Waiting));
                index++;
            }
            return;
        }

        // 执行前置任务函数
        var doPreTasks = (callback: () => void) =>
        {
            if (!task.preTasks)
            {
                callback();
                return;
            }
            var waitNum = task.preTasks.length;
            if (waitNum == 0) callback();
            task.preTasks.forEach(v => doTask(v, () =>
            {
                waitNum--;
                if (waitNum == 0) callback();
            }));
        };

        //
        task.status = TaskStatus.Waiting;

        // 执行前置任务
        doPreTasks(() =>
        {
            task.status = TaskStatus.Doing;

            // 执行任务自身
            task((result) =>
            {
                task.status = TaskStatus.Done;
                task.result = result;
                event.dispatch(task, "done");
            });
        });
    }

    /**
     * 任务，用于处理多件可能有依赖或者嵌套的事情
     */
    export class Task
    {
        private registerTasks: { [name: string]: { dependencies: string[], fn: TaskFunction } } = {};
        private tasks: { [name: string]: TaskFunction } = {};

        /**
         * 映射任务名称以及依赖列表
         * 
         * @param taskName 任务名称
         * @param dependencies 依赖任务名称列表
         * @param fn 任务函数
         */
        task(taskName: string, dependencies: string[], fn: TaskFunction)
        {
            this.registerTasks[taskName] = { dependencies: dependencies, fn: fn };
        }

        getTask(taskName: string)
        {
            if (!this.tasks[taskName]) 
            {
                var item = this.registerTasks[taskName];
                // 获取依赖函数
                var dependenciesFns = item.dependencies.map(v => this.getTask(v));
                // 
                this.tasks[taskName] = this.series([this.parallel(dependenciesFns), item.fn]);
            }

            return this.tasks[taskName];
        }

        /**
         * 把一组无序任务函数并联成一个任务函数，任务之间无依赖关系
         * 
         * @param fns 任务函数列表
         * @returns 组合后的任务函数
         */
        parallel(fns: TaskFunction[]): TaskFunction
        {
            // 构建一组任务
            var task: TaskFunction = ((done: () => void) => { done(); });
            task.preTasks = fns;
            // 完成时提取结果
            var result = (done: (result?: any) => void) =>
            {
                doTask(task, () =>
                {
                    done(task.result);
                });
            };
            return result;
        }

        /**
         * 把一组有序任务函数串联成一个任务函数，后面函数只在前面函数执行完成后调用
         * 
         * @param fns 任务函数列表
         * @param 组合后的任务函数
         */
        series(fns: TaskFunction[]): TaskFunction
        {
            // 构建一组任务
            var task: TaskFunction = ((done: () => void) => { done(); });
            task.preTasks = fns;
            // 串联任务
            fns.forEach((v, i, arr) => { if (i > 0) arr[i].preTasks = [arr[i - 1]]; });
            // 完成时提取结果
            var result = (done: (result?: any) => void) =>
            {
                doTask(task, () =>
                {
                    done(task.result);
                });
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
        parallelResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void): (done: (rs: R[]) => void) => void
        {
            // 构建一组任务
            var task: TaskFunction = ((done: () => void) => { done(); });
            task.preTasks = ps.map(p =>
            {
                return (callback) => { fn(p, callback); };
            });
            // 完成时提取结果
            var result = (done: (rs: R[]) => void) =>
            {
                doTask(task, () =>
                {
                    var results = task.preTasks.map(v => v.result);
                    done(results);
                });
            };
            return result;
        }

        /**
         * 创建一组串联同类任务，例如排序加载一组资源
         * 
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        seriesResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void): (done: (rs: R[]) => void) => void
        {
            // 构建一组任务
            var task: TaskFunction = ((done: () => void) => { done(); });
            task.preTasks = ps.map(p =>
            {
                return (callback) => { fn(p, callback); };
            });
            // 串联任务
            task.preTasks.forEach((v, i, arr) => { if (i > 0) arr[i].preTasks = [arr[i - 1]]; });
            // 完成时提取结果
            var result = (done: (rs: R[]) => void) =>
            {
                doTask(task, () =>
                {
                    var results = task.preTasks.map(v => v.result);
                    done(results);
                });
            };
            return result;
        }

        testParallelResults()
        {
            this.parallelResults([1, 2, 3, 4, 5], (p, callback: (r: number) => void) =>
            {
                callback(p);
            })((rs) =>
            {
                console.log(rs);
            });
        }

        testSeriesResults()
        {

            var starttime = Date.now();
            this.seriesResults(["tsconfig.json", "index.html",
                "app.js"], (p, callback) =>
                {
                    fs.readString(p, (err, str) =>
                    {
                        callback(str);
                    });
                })((results: string[]) =>
                {
                    console.log(`消耗时间 ${Date.now() - starttime}`);
                    console.log("succeed");
                    console.log(`结果:`);
                    console.log(results);
                });
        }

        testParallel()
        {
            console.time(`task`);
            // console.timeStamp(`task`);
            var funcs: TaskFunction[] = [1, 2, 3, 4].map(v => (callback) =>
            {
                var sleep = 1000 * Math.random();
                sleep = ~~sleep;
                console.time(`${sleep}`);
                setTimeout(() =>
                {
                    console.log(v);
                    console.timeEnd(`${sleep}`);
                    callback();
                }, sleep);
            });
            this.parallel(funcs)(() =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            });
        }

        testSeries()
        {
            console.time(`task`);
            // console.timeStamp(`task`);
            var funcs: TaskFunction[] = [1, 2, 3, 4].map(v => (callback) =>
            {
                var sleep = 1000 * Math.random();
                sleep = ~~sleep;
                console.time(`${sleep}`);
                setTimeout(() =>
                {
                    console.log(v);
                    console.timeEnd(`${sleep}`);
                    callback();
                    callback();
                }, sleep);
            });
            var fn = this.series(funcs);
            fn(() =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            });
            fn(() =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            });
        }

        testSeries1()
        {
            console.time(`task`);
            // console.timeStamp(`task`);
            var funcs: TaskFunction[] = [1, 2, 3, 4].map(v => (callback) =>
            {
                var sleep = 1000 * Math.random();
                sleep = ~~sleep;
                console.time(`${sleep}`);
                setTimeout(() =>
                {
                    console.log(v);
                    console.timeEnd(`${sleep}`);
                    callback();
                    callback();
                }, sleep);
            });
            var fn = series(funcs);
            fn(() =>
            {
                console.log(`done`);
                console.timeEnd(`task`);
                // console.timeStamp(`task`);
            });
            // fn(() =>
            // {
            //     console.log(`done`);
            //     console.timeEnd(`task`);
            //     // console.timeStamp(`task`);
            // });

        }

        testTask()
        {

            var fn = function ()
            {
                console.log("fn");
            };

            this.task("copy-html", [], fn);

            this.getTask("copy-html")(() => { });
            this.getTask("copy-html")(() => { });

            var fn1 = this.getTask("copy-html");
            var fn2 = this.getTask("copy-html");

            console.log(fn == fn1);
            console.log(fn2 == fn1);
        }
    }

    task = new Task();
}