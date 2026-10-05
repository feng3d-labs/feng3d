import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';

/**
 * `discard`：丢弃当前片元（alpha 测试等）。
 *
 * 与其它语句一样挂到"当前最近的语句容器"（for 体 > if 体 > 函数体）。
 */
export function discard(): void
{
    const stmt: IStatement = {
        toGLSL: () => 'discard;',
        toWGSL: () => 'discard;',
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
