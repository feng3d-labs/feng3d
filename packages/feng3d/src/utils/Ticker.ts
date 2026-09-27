import { Lazy, lazy, ArrayUtils } from '@feng3d/polyfill';

/**
 * 心跳计时器
 */
export class Ticker
{
    /**
     * 帧率
     */
    frameRate = 60;
    /**
     * 注册帧函数
     * @param func  执行方法
     * @param thisObject    方法this指针
     * @param priority      执行优先级
     */
    onframe(func: (interval: number) => void, thisObject?: object, priority = 0)
    {
        this.on(() => 1000 / this.frameRate, func, thisObject, priority);

        return this;
    }
    /**
     * 下一帧执行方法
     * @param func  执行方法
     * @param thisObject    方法this指针
     * @param priority      执行优先级
     */
    nextframe(func: (interval: number) => void, thisObject?: object, priority = 0)
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
    offframe(func: (interval: number) => void, thisObject?: object)
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
    on(interval: Lazy<number>, func: (interval: number) => void, thisObject?: object, priority = 0)
    {
        addTickerFunc({ interval, func, thisObject, priority, once: false });

        return this;
    }
    /**
     * 注册周期函数（只执行一次）
     * @param interval  执行周期，以ms为单位
     * @param func  执行方法
     * @param thisObject    方法this指针
     * @param priority      执行优先级
     */
    once(interval: Lazy<number>, func: (interval: number) => void, thisObject?: object, priority = 0)
    {
        addTickerFunc({ interval, func, thisObject, priority, once: true });

        return this;
    }
    /**
     * 注销周期函数
     * @param interval  执行周期，以ms为单位
     * @param func  执行方法
     * @param thisObject    方法this指针
     */
    off(interval: Lazy<number>, func: (interval: number) => void, thisObject?: object)
    {
        removeTickerFunc({ interval, func, thisObject });

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
    repeat(interval: Lazy<number>, repeatCount: number, func: (interval: number) => void, thisObject?: object, priority = 0)
    {
        repeatCount = ~~repeatCount;
        if (repeatCount < 1)
        { return; }
        const timer = new Timer(this, interval, repeatCount, func, thisObject, priority);

        return timer;
    }
}

/**
 * 心跳计时器
 */
export const ticker = new Ticker();

export class Timer
{
    private ticker: Ticker;
    private interval: Lazy<number>;
    private priority: number;
    private func: (interval: number) => void;
    private thisObject: object | undefined;

    /**
     * 计时器从 0 开始后触发的总次数。
     */
    currentCount = 0;
    /**
     * 计时器事件间的延迟（以毫秒为单位）。
     */
    delay: number;
    /**
     * 设置的计时器运行总次数。
     */
    repeatCount: number;

    constructor(ticker: Ticker, interval: Lazy<number>, repeatCount: number, func: (interval: number) => void, thisObject?: object, priority = 0)
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
        this.currentCount++;
        this.repeatCount--;
        this.func.call(this.thisObject, lazy.getvalue(this.interval));
        if (this.repeatCount < 1)
        { this.stop(); }
    }
}

interface TickerFuncItem
{
    interval: Lazy<number>,
    func: (interval: number) => void,
    thisObject?: object,
    priority?: number,
    once?: boolean
    //
    runtime?: number;
}
const tickerFuncs: TickerFuncItem[] = [];

let started = false;

/**
 * 启动 ticker 循环（幂等）。
 *
 * 原实现在模块顶层直接调用 `runTickerFuncs()`：任何 `import ... from './Ticker'` 都会无条件
 * 启动 rAF 循环——既无法关闭，也让 tree-shaking 判断不了这个模块能不能整体消除
 * （R2「零模块级副作用」，issue #88）。现在改由首次注册 ticker 函数时惰性启动。
 */
export function startTicker(): void
{
    if (started) return;
    started = true;
    runTickerFuncs();
}

function addTickerFunc(item: TickerFuncItem)
{
    if (running)
    {
        affers.push([addTickerFunc, [item]]);

        return;
    }
    // removeTickerFunc(item);
    if (item.priority === undefined)
    { item.priority = 0; }
    item.runtime = Date.now() + lazy.getvalue(item.interval);
    tickerFuncs.push(item);
    // 有活儿了才启动循环：import 不再是无条件副作用（R2 / issue #88）
    startTicker();
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
        const element = tickerFuncs[i];
        if (lazy.getvalue(element.interval) === lazy.getvalue(item.interval)
            && element.func === item.func
            && element.thisObject === item.thisObject
        )
        {
            tickerFuncs.splice(i, 1);
        }
    }
}

let running = false;
const affers: [Function, unknown[]][] = [];

function runTickerFuncs()
{
    running = true;
    // 倒序，优先级高的排在后面
    tickerFuncs.sort((a, b) =>
        <number>a.priority - <number>b.priority);
    const currenttime = Date.now();
    const needTickerFuncItems: TickerFuncItem[] = [];
    for (let i = tickerFuncs.length - 1; i >= 0; i--)
    {
        const element = tickerFuncs[i];
        if (<number>element.runtime < currenttime)
        {
            needTickerFuncItems.push(element);
            if (element.once)
            {
                tickerFuncs.splice(i, 1);
                continue;
            }
            element.runtime = nextRuntime(<number>element.runtime, lazy.getvalue(element.interval));
        }
    }
    needTickerFuncItems.reverse();
    // 相同的函数只执行一个
    ArrayUtils.unique(needTickerFuncItems, (a, b) => (a.func === b.func && a.thisObject === b.thisObject));
    needTickerFuncItems.forEach((v) =>
    {
        // try
        // {
        v.func.call(v.thisObject, lazy.getvalue(v.interval));
        // } catch (error)
        // {
        //     console.warn(`${v.func} 方法执行错误，从 ticker 中移除`, error)
        //     var index = tickerFuncs.indexOf(v);
        //     if (index != -1) tickerFuncs.splice(index, 1);
        // }
    });
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

/**
 * 当前环境的帧回调调度函数。
 *
 * `strictNullChecks` 下不能"声明后靠分支赋值"（TS 认为可能未赋值），所以先给一个
 * setTimeout 兜底实现，再由下面的特征探测覆盖——语义与原来一致（找不到 rAF 就用定时器）。
 */
let localrequestAnimationFrame: (callback: FrameRequestCallback) => number
    = function (callback)
    {
        return setTimeout(callback, 1000 / ticker.frameRate) as unknown as number;
    };

if (typeof requestAnimationFrame !== 'undefined')
{
    localrequestAnimationFrame = requestAnimationFrame;
}
else if (typeof window !== 'undefined')
{
    // 兼容不同运行环境（浏览器/Node），通过特征探测选取可用的全局对象
    const w = window as unknown as Record<string, ((cb: FrameRequestCallback) => number) | undefined>;

    localrequestAnimationFrame
        = w['requestAnimationFrame']
        || w['webkitRequestAnimationFrame']
        || w['mozRequestAnimationFrame']
        || w['oRequestAnimationFrame']
        || w['msRequestAnimationFrame']
        || localrequestAnimationFrame;
}

