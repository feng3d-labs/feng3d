import { Func } from '../shader/func';

/**
 * 当前正在执行的函数实例（用于收集 _let 和 _return 语句）
 * @internal
 */
let currentFunc: Func | null = null;

/**
 * 设置当前正在执行的函数实例
 * @internal
 */
export function setCurrentFunc(instance: Func | null): void
{
    currentFunc = instance;
}

/**
 * 获取当前正在执行的函数实例
 * @internal
 */
export function getCurrentFunc(): Func | null
{
    return currentFunc;
}

