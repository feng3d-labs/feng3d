import { Effect, effect, EffectScope } from '@feng3d/reactivity';

/**
 * 响应式类基类
 *
 * 提供响应式编程的基础功能，包括：
 * 1. 提供副作用管理机制，自动管理副作用的生命周期
 * 2. 在类销毁时自动清理所有副作用，防止内存泄漏
 *
 * 使用方式：
 * ```typescript
 * class MyClass extends ReactiveObject {
 *   constructor() {
 *     super();
 *
 *     // 创建副作用，会自动管理生命周期
 *     this.effect(() => {
 *       ...
 *     });
 *   }
 * }
 * ```
 */
export class ReactiveObject
{
    constructor()
    {
        // console.log(this.constructor.name, map[this.constructor.name] = (map[this.constructor.name] || 0) + 1);
    }

    /**
     * 副作用作用域
     *
     * 用于管理所有副作用的生命周期：
     * - 收集所有通过 effect() 方法创建的副作用
     * - 在类销毁时自动停止所有副作用
     * - 防止副作用在类销毁后继续执行，避免内存泄漏
     *
     * 私有属性，外部无法直接访问，只能通过 effect() 方法使用
     */
    private _effectScope = new EffectScope();

    /**
     * 销毁时需要执行的函数
     */
    private _destroyCallbacks: (() => void)[] = [];

    /**
     * 创建并运行副作用
     *
     * 功能：
     * 1. 将传入的函数包装为副作用
     * 2. 自动收集副作用中访问的响应式属性作为依赖
     * 3. 当依赖变化时自动重新执行副作用
     * 4. 在类销毁时自动停止副作用
     *
     * 使用场景：
     * - 监听属性变化并执行相应操作
     * - 自动更新UI或重新计算派生状态
     * - 执行清理或初始化逻辑
     *
     * @param fn 副作用函数，会在依赖变化时自动执行
     *
     * 使用示例：
     * ```typescript
     * this.effect(() => {
     *   // 访问响应式属性，建立依赖关系
     *   const value = reactive(this).someProperty;
     *
     *   // 执行相应的逻辑
     *   this.updateUI(value);
     * });
     * ```
     */
    effect(fn: () => void)
    {
        let eff: Effect;

        this._effectScope.run(() =>
        {
            eff = effect(fn);
        });

        return eff;
    }

    /**
     * 销毁时执行的函数
     * @param callback 销毁时执行的函数
     */
    destroyCall(callback: () => void)
    {
        this._destroyCallbacks.push(callback);
    }

    /**
     * 销毁响应式类实例
     *
     * 执行清理操作：
     * 1. 执行所有注册的清理函数
     * 2. 停止所有副作用作用域，防止副作用继续执行
     * 3. 清理引用，帮助垃圾回收，防止内存泄漏
     *
     * 重要：
     * - 子类重写此方法时必须调用 super.destroy()
     * - 确保在类实例不再使用时调用此方法
     * - 调用后实例将无法再使用 effect() 方法
     *
     * 使用示例：
     * ```typescript
     * class MyClass extends ReactiveObject {
     *   destroy() {
     *     // 执行子类特定的清理逻辑
     *     this.cleanup();
     *
     *     // 必须调用父类的destroy方法
     *     super.destroy();
     *   }
     * }
     * ```
     */
    destroy()
    {
        // 执行所有注册的清理函数
        this._destroyCallbacks?.forEach((item) => item());
        this._destroyCallbacks = null;

        // 停止副作用作用域，这会自动停止所有通过 effect() 创建的副作用
        this._effectScope?.stop();
        this._effectScope = null;
    }
}

const map: { [key: string]: number } = {};