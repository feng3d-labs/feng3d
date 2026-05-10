import { IfStatement } from '../control/if_';

/**
 * 当前的if语句堆栈（用于跟踪当前是否在if语句体中）
 * @internal
 */
let ifStack: IfStatement[] = [];

/**
 * 将if语句添加到堆栈顶部
 * @internal
 */
export function pushIfStatement(ifStatement: IfStatement): void
{
    ifStack.push(ifStatement);
}

/**
 * 从堆栈顶部移除if语句
 * @internal
 */
export function popIfStatement(): void
{
    ifStack.pop();
}

/**
 * 获取当前if语句（堆栈顶部的if语句）
 * @internal
 */
export function getCurrentIfStatement(): IfStatement | null
{
    return ifStack[ifStack.length - 1] || null;
}
