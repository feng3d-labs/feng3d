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

    // **if 体比 for 体更近**：`for (...) { if (...) { continue; } }` 里的 continue
    // 必须落在 if 体内（曾经 for 优先，导致 continue 被放到循环体、把后面的语句全跳过）。
    const currentIfStatement = getCurrentIfStatement();
    const currentForStatement = getCurrentForStatement();
    const currentFunc = getCurrentFunc();

    if (currentIfStatement)
    {
        currentIfStatement.addStatement(stmt);
    }
    else if (currentForStatement)
    {
        currentForStatement.addStatement(stmt);
    }
    else if (currentFunc)
    {
        currentFunc.statements.push(stmt);
    }
}
