import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';

/**
 * `continue`：跳过本轮循环（WGSL 的 `continue;`）。
 *
 * 名字带下划线是因为 `continue` 是 JS 保留字。与 {@link discard} 一样挂到
 * "当前最近的语句容器"（for 体 > if 体 > 函数体）。
 */
export function continue_(): void
{
    const stmt: IStatement = {
        toGLSL: () => 'continue;',
        toWGSL: () => 'continue;',
    };

    const currentForStatement = getCurrentForStatement();
    const currentIfStatement = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentForStatement)
    {
        currentForStatement.addStatement(stmt);
    }
    else if (currentIfStatement)
    {
        currentIfStatement.addStatement(stmt);
    }
    else if (currentFunc)
    {
        currentFunc.statements.push(stmt);
    }
}
