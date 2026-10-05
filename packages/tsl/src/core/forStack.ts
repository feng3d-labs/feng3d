import { IStatement } from './Statement';

/**
 * 当前的循环语句堆栈（用于跟踪当前是否在 for / while 语句体中）。
 *
 * 与 `ifStack` 同构：语句的收集点（`var_` / `Assign` / `if_`）需要知道
 * "当前最近的语句容器"是 for 还是 if，才能把新语句挂到正确的层级。
 *
 * @internal
 */
let forStack: { addStatement(statement: IStatement): void }[] = [];

/**
 * 将 for 语句添加到堆栈顶部
 * @internal
 */
export function pushForStatement(forStatement: { addStatement(statement: IStatement): void }): void
{
    forStack.push(forStatement);
}

/**
 * 从堆栈顶部移除 for 语句
 * @internal
 */
export function popForStatement(): void
{
    forStack.pop();
}

/**
 * 获取当前 for 语句（堆栈顶部的 for 语句）
 * @internal
 */
export function getCurrentForStatement(): { addStatement(statement: IStatement): void } | null
{
    return forStack[forStack.length - 1] || null;
}
