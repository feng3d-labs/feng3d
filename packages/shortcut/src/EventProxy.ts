import { EventEmitter, IEvent } from '@feng3d/event';

/**
 * 代理 EventTarget, 处理js事件中this关键字问题
 */
export class EventProxy<T = any> extends EventEmitter<T>
{
    pageX = 0;
    pageY = 0;
    clientX = 0;
    clientY = 0;

    /**
     * 是否右击
     */
    rightmouse = false;

    /** 鼠标按键（0=左键，1=中键，2=右键） */
    button = 0;

    /** 是否按下 Shift（编辑器用于「按住 Shift 加快移动/缩放」「Shift 加选」） */
    shiftKey = false;

    /** 是否按下 Ctrl（编辑器用于「Ctrl 加选」） */
    ctrlKey = false;

    /** 是否按下 Alt（编辑器用于视口导航手势判定） */
    altKey = false;

    /** 是否按下 Meta/Cmd */
    metaKey = false;

    key = '';

    keyCode = 0;

    deltaY = 0;

    private listentypes: (keyof T)[] = [];

    /**
     * 事件目标。
     *
     * 构造时若传入的是「目标解析函数」（见构造函数），首次读取本属性
     * （或首次 `on()` / `off()`）才调用它取得目标。
     */
    get target(): EventTarget | undefined
    {
        return this._resolveTarget();
    }
    set target(v: EventTarget | undefined)
    {
        if (this._target === v) return;
        // 显式设置目标后不再做惰性解析
        this._targetProvider = undefined;
        if (this._target)
        {
            // 闭包内 TS 不保留对字段的收窄，先固化到局部变量
            const target = this._target;

            this.listentypes.forEach((element) =>
            {
                target.removeEventListener(element as any, this.onMouseKey);
            });
        }
        this._target = v;
        if (this._target)
        {
            const target = this._target;

            this.listentypes.forEach((element) =>
            {
                target.addEventListener(element as any, this.onMouseKey);
            });
        }
    }

    // target 允许缺省（构造函数参数可选，setter 内部对空值有完整分支），故如实带上 undefined
    private _target: EventTarget | undefined;

    /**
     * 缺省事件目标的**解析函数**。
     *
     * 不直接持有目标、而持有「怎么取到目标」：宿主全局（`self` / `window`）的读取因此被
     * 推迟到首次真正需要目标时，模块 import 期不再读取宿主全局 —— Node / SSR 下 `self`
     * 未声明，import 期读取会直接 `ReferenceError`（issue #620 / #624）。
     */
    private _targetProvider: (() => EventTarget | undefined) | undefined;

    /**
     * @param target 事件目标；也可传入「目标解析函数」，此时目标的取得被推迟到首次使用时。
     *
     * 接受解析函数是**向后兼容的扩展**（原先只接受目标对象），用途是避免模块顶层读取宿主全局。
     */
    constructor(target?: EventTarget | (() => EventTarget | undefined))
    {
        super();
        if (typeof target === 'function')
        {
            this._targetProvider = target as () => EventTarget | undefined;
        }
        else
        {
            this.target = target as EventTarget | undefined;
        }
    }

    /**
     * 惰性解析缺省事件目标：只在首次需要目标时调用一次解析函数。
     *
     * 解析成功后走 `target` setter 赋值，从而把已注册的事件类型绑定到目标上。
     * 宿主里取不到目标（例如 Node 下没有 `self`）时保持 `undefined` 且只尝试一次：
     * 这样模块可以被 import，真正要用事件时由调用方决定如何处理——与改动前
     * 「浏览器里构造即持有 `self`」的路径等价（浏览器下首次使用时同样能取到 `self`）。
     *
     * @returns 解析后的事件目标（取不到则为 `undefined`）
     */
    private _resolveTarget(): EventTarget | undefined
    {
        if (this._target === undefined && this._targetProvider)
        {
            const provider = this._targetProvider;

            this._targetProvider = undefined;
            const target = provider();

            if (target) this.target = target;
        }

        return this._target;
    }

    /**
     * 监听一次事件后将会被移除
     * @param type 事件的类型。
     * @param listener 处理事件的侦听器函数。
     * @param thisObject listener函数作用域
     * @param priority 事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
     */
    once<K extends keyof T>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority?: number)
    {
        this.on(type as any, listener, thisObject, priority, true);

        return this;
    }

    /**
     * 添加监听
     * @param type 事件的类型。
     * @param listener 处理事件的侦听器函数。
     * @param priority 事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
     */
    on<K extends keyof T & string>(type: K, listener: (event: IEvent<T[K]>) => void, thisObject?: any, priority = 0, once = false): this
    {
        super.on(type, listener, thisObject, priority, once);
        if (this.listentypes.indexOf(type) === -1)
        {
            // 惰性解析：宿主全局（如 self）在这里才被读取，而不是模块 import 期。
            // 顺序有意为之——先解析再登记：解析走 setter，会按**当前** listentypes 绑定已有类型；
            // 若先 push 再解析，本类型会被 setter 绑一次、下面又绑一次（重复 addEventListener）。
            this._resolveTarget();
            this.listentypes.push(type);
            // 目标缺省（Node / SSR 这类没有宿主事件系统的环境）：退化为纯 EventEmitter——
            // 上面的监听注册照旧生效，只是不去绑 DOM 事件（没有事件源，绑了也无从触发）。
            // 这与构造函数 target 可选、setter 对空值有完整分支的既有设计一致。
            this._target?.addEventListener(type as any, this.onMouseKey);
        }

        return this;
    }

    /**
     * 移除监听
     * @param dispatcher 派发器
     * @param type 事件的类型。
     * @param listener 要删除的侦听器对象。
     */
    off<K extends keyof T & string>(type?: K, listener?: (event: IEvent<T[K]>) => void, thisObject?: any): this
    {
        super.off(type, listener, thisObject);
        if (!type)
        {
            // 同上：先确保惰性解析已发生；目标缺省时 on() 也没绑过 DOM 事件，故只清登记
            this._resolveTarget();
            const target = this._target;

            if (target)
            {
                this.listentypes.forEach((element) =>
                {
                    target.removeEventListener(element as any, this.onMouseKey);
                });
            }
            this.listentypes.length = 0;
        }
        else if (!this.has(type))
        {
            // 同上：先确保惰性解析已发生，行为与「构造时即持有目标」的写法一致
            this._resolveTarget();
            this._target?.removeEventListener(type, this.onMouseKey);
            this.listentypes.splice(this.listentypes.indexOf(type), 1);
        }

        return this;
    }

    /**
     * 处理鼠标按下时同时出发 "mousemove" 事件bug
     */
    private handleMouseMoveBug = true;
    // mouseup 时会置 null 表示"没有按下点"，读取点本就有真值判断，故如实带上 null
    private mousedownposition: { x: number, y: number } | null;
    /**
     * 键盘按下事件
     */
    private onMouseKey = (event) =>
    {
        // this.clear();

        if (event.clientX !== undefined)
        {
            this.clientX = event.clientX;
            this.clientY = event.clientY;
            this.pageX = event.pageX;
            this.pageY = event.pageY;
        }

        if (event instanceof MouseEvent)
        {
            this.rightmouse = event.button === 2;
            this.button = event.button;
            this.shiftKey = event.shiftKey;
            this.ctrlKey = event.ctrlKey;
            this.altKey = event.altKey;
            this.metaKey = event.metaKey;

            // 处理鼠标按下时同时出发 "mousemove" 事件bug
            if (this.handleMouseMoveBug)
            {
                if (event.type === 'mousedown')
                {
                    this.mousedownposition = { x: event.clientX, y: event.clientY };
                }
                if (event.type === 'mousemove')
                {
                    if (this.mousedownposition)
                    {
                        if (this.mousedownposition.x === event.clientX && this.mousedownposition.y === event.clientY)
                        {
                            // console.log(`由于系统原因，触发mousedown同时触发了mousemove，此处屏蔽mousemove事件派发！`);
                            return;
                        }
                    }
                }
                if (event.type === 'mouseup')
                {
                    this.mousedownposition = null;
                }
            }
        }

        if (event instanceof KeyboardEvent)
        {
            this.keyCode = event.keyCode;
            this.key = event.key;
        }

        if (event instanceof WheelEvent)
        {
            this.deltaY = event.deltaY;
        }

        // 赋值上次鼠标事件值
        // event.clientX = this.clientX;
        // event.clientY = this.clientY;
        // event.pageX = this.pageX;
        // event.pageY = this.pageY;

        this.emit(event.type, event);
    };

    /**
     * 清理数据
     */
    private clear()
    {
        this.clientX = 0;
        this.clientY = 0;
        this.rightmouse = false;
        this.key = '';
        this.keyCode = 0;
        this.deltaY = 0;
    }
}
