import { getCurrentForStatement } from '../core/forStack';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';
import { IElement } from '../core/IElement';
import { IStatement } from '../core/Statement';

/**
 * 把**表达式**当作独立语句挂到当前最近的语句容器。
 *
 * 用途：调用无返回值的辅助函数（如 `local_compare_and_swap(a, b);`）
 * 或任何"值被丢弃、但必须执行"的表达式。
 *
 * ```ts
 * statement(localCompareAndSwap(idx.x, idx.y));
 * ```
 *
 * @param value 要执行的表达式
 */
export function statement(value: IElement): void
{
    const stmt: IStatement = {
        toGLSL: () => `${value.toGLSL()};`,
        toWGSL: () => `${value.toWGSL()};`,
    };

    const currentFor = getCurrentForStatement();
    const currentIf = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentFor) currentFor.addStatement(stmt);
    else if (currentIf) currentIf.addStatement(stmt);
    else if (currentFunc) currentFunc.statements.push(stmt);

    // 表达式本身（及其依赖）要作为依赖被收集——否则缺函数定义 / 缺声明
    if (currentFunc) currentFunc.dependencies.push(value);
}
