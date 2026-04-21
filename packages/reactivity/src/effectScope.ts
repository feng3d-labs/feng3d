import type { Effect as ReactiveEffect } from './effect';
import { warn } from './shared/general';

/**
 * 当前活动的效果作用域
 */
export let activeEffectScope: EffectScope | undefined;

/**
 * 效果作用域类
 *
 * 用于管理一组相关的响应式效果，可以统一控制它们的生命周期。
 */
export class EffectScope
{
    /**
     * 作用域是否处于活动状态
     * @internal
     */
    private _active = true;
    /**
     * 跟踪 on 方法的调用次数，允许多次调用 on 方法
     * @internal
     */
    private _on = 0;
    /**
     * 存储当前作用域中的所有效果
     * @internal
     */
    effects: ReactiveEffect[] = [];
    /**
     * 存储清理函数
     * @internal
     */
    cleanups: (() => void)[] = [];

    /**
     * 作用域是否被暂停
     */
    private _isPaused = false;

    /**
     * 父作用域，仅由非分离的作用域分配
     * @internal
     */
    parent: EffectScope | undefined;
    /**
     * 记录未分离的子作用域
     * @internal
     */
    scopes: EffectScope[] | undefined;
    /**
     * 在父作用域的 scopes 数组中记录子作用域的索引，用于优化移除操作
     * @internal
     */
    private index: number | undefined;

    /**
     * 构造函数
     * @param detached 是否创建分离的作用域
     */
    constructor(public detached = false)
    {
        this.parent = activeEffectScope;
        if (!detached && activeEffectScope)
        {
            this.index =
                (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
                    this,
                ) - 1;
        }
    }

    /**
     * 获取作用域是否处于活动状态
     */
    get active(): boolean
    {
        return this._active;
    }

    /**
     * 暂停作用域
     *
     * 暂停当前作用域及其所有子作用域和效果
     */
    pause(): void
    {
        if (this._active)
        {
            this._isPaused = true;
            let i: number, l: number;

            if (this.scopes)
            {
                for (i = 0, l = this.scopes.length; i < l; i++)
                {
                    this.scopes[i].pause();
                }
            }
            for (i = 0, l = this.effects.length; i < l; i++)
            {
                this.effects[i].pause();
            }
        }
    }

    /**
     * 恢复作用域
     *
     * 恢复当前作用域及其所有子作用域和效果
     */
    resume(): void
    {
        if (this._active)
        {
            if (this._isPaused)
            {
                this._isPaused = false;
                let i: number, l: number;

                if (this.scopes)
                {
                    for (i = 0, l = this.scopes.length; i < l; i++)
                    {
                        this.scopes[i].resume();
                    }
                }
                for (i = 0, l = this.effects.length; i < l; i++)
                {
                    this.effects[i].resume();
                }
            }
        }
    }

    /**
     * 在作用域中运行函数
     * @param fn 要运行的函数
     * @returns 函数的返回值
     */
    run<T>(fn: () => T): T | undefined
    {
        if (this._active)
        {
            const currentEffectScope = activeEffectScope;

            try
            {
                activeEffectScope = this;

                return fn();
            }
            finally
            {
                activeEffectScope = currentEffectScope;
            }
        }
        else if (__DEV__)
        {
            warn(`无法运行已停用的 effect 作用域。`);
        }
    }

    /**
     * 前一个作用域
     */
    prevScope: EffectScope | undefined;
    /**
     * 激活作用域
     * 仅应在非分离的作用域上调用
     * @internal
     */
    on(): void
    {
        if (++this._on === 1)
        {
            this.prevScope = activeEffectScope;
            activeEffectScope = this;
        }
    }

    /**
     * 停用作用域
     * 仅应在非分离的作用域上调用
     * @internal
     */
    off(): void
    {
        if (this._on > 0 && --this._on === 0)
        {
            activeEffectScope = this.prevScope;
            this.prevScope = undefined;
        }
    }

    /**
     * 停止作用域
     *
     * 停止当前作用域及其所有子作用域和效果，并执行清理函数
     * @param fromParent 是否由父作用域调用
     */
    stop(fromParent?: boolean): void
    {
        if (this._active)
        {
            this._active = false;
            let i: number, l: number;

            for (i = 0, l = this.effects.length; i < l; i++)
            {
                this.effects[i].stop();
            }
            this.effects.length = 0;

            for (i = 0, l = this.cleanups.length; i < l; i++)
            {
                this.cleanups[i]();
            }
            this.cleanups.length = 0;

            if (this.scopes)
            {
                for (i = 0, l = this.scopes.length; i < l; i++)
                {
                    this.scopes[i].stop(true);
                }
                this.scopes.length = 0;
            }

            // 嵌套作用域，从父作用域中解除引用以避免内存泄漏
            if (!this.detached && this.parent && !fromParent)
            {
                // 优化的 O(1) 移除
                const last = this.parent.scopes!.pop();

                if (last && last !== this)
                {
                    this.parent.scopes![this.index!] = last;
                    last.index = this.index!;
                }
            }
            this.parent = undefined;
        }
    }
}

/**
 * 创建效果作用域对象
 *
 * 可以捕获在其中创建的响应式效果（即计算属性和观察者），以便这些效果可以一起处理。
 *
 * @param detached 是否创建分离的作用域
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#effectscope}
 */
export function effectScope(detached?: boolean): EffectScope
{
    return new EffectScope(detached);
}

/**
 * 获取当前活动的效果作用域
 *
 * @returns 当前活动的效果作用域，如果没有则返回 undefined
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#getcurrentscope}
 */
export function getCurrentScope(): EffectScope | undefined
{
    return activeEffectScope;
}

/**
 * 在当前活动的效果作用域上注册清理回调
 *
 * 当关联的效果作用域停止时，将调用此回调函数。
 *
 * @param fn 要附加到作用域清理的回调函数
 * @param failSilently 是否静默失败
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#onscopedispose}
 */
export function onScopeDispose(fn: () => void, failSilently = false): void
{
    if (activeEffectScope)
    {
        activeEffectScope.cleanups.push(fn);
    }
    else if (__DEV__ && !failSilently)
    {
        warn(
            `onScopeDispose() 在没有活动的 effect 作用域时被调用，无法关联。`,
        );
    }
}
