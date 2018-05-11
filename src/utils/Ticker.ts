namespace feng3d
{
    /**
     * 心跳计时器
     */
    export var ticker: Ticker;

    /**
     * 心跳计时器
     */
    export class Ticker 
    {
        /**
         * 帧率
         */
        frameRate = 60
        /**
         * 注册帧函数
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        onframe(func: () => void, thisObject?: Object, priority = 0)
        {
            this.on(() => 1000 / this.frameRate, func, thisObject, priority);
            return this;
        }
        /**
         * 注册帧函数（只执行一次）
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        onceframe(func: () => void, thisObject?: Object, priority = 0)
        {
            this.once(() => 1000 / this.frameRate, func, thisObject, priority);
            return this;
        }
        /**
         * 注销帧函数（只执行一次）
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        offframe(func: () => void, thisObject?: Object)
        {
            this.off(() => 1000 / this.frameRate, func, thisObject);
            return this;
        }
        /**
         * 注册周期函数
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        on(interval: Lazy<number>, func: () => void, thisObject?: Object, priority = 0)
        {
            addTickerFunc({ interval: interval, func: func, thisObject: thisObject, priority: priority, once: false });
            return this;
        }
        /**
         * 注册周期函数（只执行一次）
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        once(interval: Lazy<number>, func: () => void, thisObject?: Object, priority = 0)
        {
            addTickerFunc({ interval: interval, func: func, thisObject: thisObject, priority: priority, once: true });
            return this;
        }
        /**
         * 注销周期函数
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         */
        off(interval: Lazy<number>, func: () => void, thisObject?: Object)
        {
            removeTickerFunc({ interval: interval, func: func, thisObject: thisObject });
            return this;
        }
        /**
         * 重复指定次数 执行函数
         * @param interval  执行周期，以ms为单位
         * @param 	repeatCount     执行次数
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        repeat(interval: Lazy<number>, repeatCount: number, func: () => void, thisObject?: Object, priority = 0)
        {
            repeatCount = ~~repeatCount;
            if (repeatCount < 1)
                return;
            var timer = new Timer(this, interval, repeatCount, func, thisObject, priority);
            return timer;
        }
    }

    ticker = new Ticker();

    export class Timer
    {
        private ticker: Ticker;
        private interval: Lazy<number>;
        private priority: number;
        private func: () => void;
        private thisObject: Object

        /**
         * 计时器从 0 开始后触发的总次数。
         */
        currentCount = 0
        /**
         * 计时器事件间的延迟（以毫秒为单位）。
         */
        delay: number
        /**
         * 设置的计时器运行总次数。
         */
        repeatCount: number

        constructor(ticker: Ticker, interval: Lazy<number>, repeatCount: number, func: () => void, thisObject?: Object, priority = 0)
        {
            this.ticker = ticker;
            this.interval = interval;
            this.func = func;
            this.thisObject = thisObject;
            this.priority = priority;
        }
        /**
         * 如果计时器尚未运行，则启动计时器。
         */
        start()
        {
            this.ticker.on(this.interval, this.runfunc, this, this.priority);
            return this;
        }
        /**
         * 停止计时器。
         */
        stop()
        {
            this.ticker.off(this.interval, this.runfunc, this);
            return this;
        }
        /**
         * 如果计时器正在运行，则停止计时器，并将 currentCount 属性设回为 0，这类似于秒表的重置按钮。
         */
        reset()
        {
            this.stop();
            this.currentCount = 0;
            return this;
        }

        private runfunc()
        {
            this.func.call(this.thisObject);
            this.currentCount++;
            this.repeatCount--;
            if (this.repeatCount < 1)
                this.stop();
        }
    }

    interface TickerFuncItem
    {
        interval: Lazy<number>,
        func: () => void,
        thisObject?: Object,
        priority?: number,
        once?: boolean
        //
        runtime?: number;
    }
    var tickerFuncs: TickerFuncItem[] = [];

    function addTickerFunc(item: TickerFuncItem)
    {
        if (running)
        {
            affers.push([addTickerFunc, [item]]);
            return;
        }
        removeTickerFunc(item);
        if (item.priority == undefined)
            item.priority = 0;
        item.runtime = Date.now() + lazy.getvalue(item.interval);
        tickerFuncs.push(item);
    }

    function removeTickerFunc(item: TickerFuncItem)
    {
        if (running)
        {
            affers.push([removeTickerFunc, [item]]);
            return;
        }
        for (let i = tickerFuncs.length - 1; i >= 0; i--)
        {
            var element = tickerFuncs[i];
            if (lazy.getvalue(element.interval) == lazy.getvalue(item.interval)
                && element.func == item.func
                && element.thisObject == item.thisObject
            )
            {
                tickerFuncs.splice(i, 1);
            }
        }
    }

    var running = false;
    var affers: [Function, any[]][] = [];

    function runTickerFuncs()
    {
        running = true;
        //倒序，优先级高的排在后面
        tickerFuncs.sort((a, b) =>
        {
            return <number>a.priority - <number>b.priority;
        });
        var currenttime = Date.now();
        for (let i = tickerFuncs.length - 1; i >= 0; i--)
        {
            var element = tickerFuncs[i];
            if (<number>element.runtime < currenttime)
            {
                // try
                // {
                element.func.call(element.thisObject);
                // } catch (error)
                // {
                //     warn(`${element.func} 方法执行错误，从 ticker 中移除`, error)
                //     tickerFuncs.splice(i, 1);
                //     continue;
                // }
                if (element.once)
                {
                    tickerFuncs.splice(i, 1);
                    continue;
                }
                element.runtime = nextRuntime(<number>element.runtime, lazy.getvalue(element.interval));
            }
        }

        running = false;

        for (let i = 0; i < affers.length; i++)
        {
            const affer = affers[i];
            affer[0].apply(null, affer[1]);
        }
        affers.length = 0;

        localrequestAnimationFrame(runTickerFuncs);

        function nextRuntime(runtime: number, interval: number)
        {
            return runtime + Math.ceil((currenttime - runtime) / interval) * interval;
        }
    }

    var localrequestAnimationFrame: (callback: FrameRequestCallback) => number;
    if (typeof requestAnimationFrame == "undefined")
    {
        if (typeof window != "undefined")
        {
            localrequestAnimationFrame =
                window["requestAnimationFrame"] ||
                window["webkitRequestAnimationFrame"] ||
                window["mozRequestAnimationFrame"] ||
                window["oRequestAnimationFrame"] ||
                window["msRequestAnimationFrame"];
        } else
        {
            localrequestAnimationFrame = function (callback)
            {
                return window.setTimeout(callback, 1000 / ticker.frameRate);
            };
        }
    } else
    {
        localrequestAnimationFrame = requestAnimationFrame;
    }

    runTickerFuncs();
}