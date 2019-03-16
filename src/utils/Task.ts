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
     * 任务，用于处理多件可能有依赖或者嵌套的事情
     */
    export class Task extends EventDispatcher
    {
        /**
         * 前置任务
         */
        preTasks?: Task[];

        /**
         * 默认初始状态，未开始，状态不可逆
         */
        status = TaskStatus.None;

        /**
         * 任务自身内容，回调带回结果保存在 result.value 中
         */
        content?: (callback: (result?: any) => void) => void;

        /**
         * 任务自身内容回调带回结果
         */
        result: any;

        do(callback?: () => void)
        {
            if (this.status == TaskStatus.Done) { callback(); return; }

            // 回调添加到完成事件中
            this.once("done", callback);

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

            // 设置默认值
            this.preTasks = this.preTasks || [];
            this.content = this.content || ((callback: () => void) => { callback(); });

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
                    this.dispatch("done");
                });
            });
        }

        // do<T, K>(tasks: ITask<T, K>)
        // {
        //     // tasks

        //     // 
        //     task.status = TaskStatus.Doing;

        //     /**
        //      * 执行前置任务
        //      */
        //     var doPreTasks = (callback: () => void) =>
        //     {
        //         var undos = tasks.filter(v => v.status == TaskStatus.Undo);
        //         var doings = tasks.filter(v => v.status == TaskStatus.Doing);

        //         if (undos.length == 0 && doings.length == 0)
        //         {
        //             // 前置任务全部完成
        //             callback();
        //             return;
        //         }

        //     };

        //     /**
        //      * 执行自身任务
        //      */
        //     var doContent = (callback) =>
        //     {

        //     };

        //     /**
        //      * 检查任务，执行未开始任务，等待全部完成
        //      */
        //     var checkTask = () =>
        //     {
        //         var undos = task.preTask.filter(v => (v.status == undefined || v.status == TaskStatus.Undo));
        //         var doings = task.preTask.filter(v => v.status == TaskStatus.Doing);

        //         if (undos.length + doings.length > 0)
        //         {
        //             undos.forEach(v =>
        //             {
        //                 this.do(v)
        //             });
        //             return;
        //         }

        //     }
        //     checkTask();


        // // 执行前置任务
        // doPreTasks(() =>
        // {
        //     // 执行自身任务
        //     doContent(() =>
        //     {

        //     });
        // });

        // var index = 0;
        // if (index >= task.preTask.length)
        // {
        //     task.preTask[index]
        // }
        // // task.preTask

        // }
    }
}