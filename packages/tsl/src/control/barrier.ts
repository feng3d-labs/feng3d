import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';

/**
 * 挂一条无参数的同步语句（barrier 族）。
 *
 * 与 discard / return_ 同类：挂到**当前最近的语句容器**（switch 体 > if 体 > for 体 > 函数体）。
 *
 * @param wgslName WGSL 侧的名字
 * @param glslName GLSL 侧的名字
 */
function barrierStatement(wgslName: string, glslName: string): void
{
    const stmt: IStatement = {
        toGLSL: () => `${glslName}();`,
        toWGSL: () => `${wgslName}();`,
    };

    // switch 的分支体在 forStack 上（见 switch_.ts），所以先看 for 栈
    const currentFor = getCurrentForStatement();
    const currentIf = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentFor) currentFor.addStatement(stmt);
    else if (currentIf) currentIf.addStatement(stmt);
    else if (currentFunc) currentFunc.statements.push(stmt);
}

/**
 * 工作组内同步：`workgroupBarrier()`
 *
 * compute 里读写 `var<workgroup>` 共享内存后必须调用它，
 * 否则同一工作组的调用之间没有可见性保证。
 */
export function workgroupBarrier(): void
{
    barrierStatement('workgroupBarrier', 'barrier');
}

/**
 * 存储缓冲区同步：`storageBarrier()`
 */
export function storageBarrier(): void
{
    barrierStatement('storageBarrier', 'barrier');
}

/**
 * 纹理同步：`textureBarrier()`
 */
export function textureBarrier(): void
{
    barrierStatement('textureBarrier', 'barrier');
}
