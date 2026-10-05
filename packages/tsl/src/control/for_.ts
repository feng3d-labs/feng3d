import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';
import { getCurrentForStatement, pushForStatement, popForStatement } from '../core/forStack';
import { Int } from '../types/scalar/int';

/**
 * for 循环语句：`for (var <name> = <from>; <name> < <to>; <name> = <name> + 1) { ... }`
 *
 * 仅支持「整数计数 + 固定上下界」这一种最常见形态（蒙皮、数组遍历等）——
 * 更复杂的循环（任意条件 / 步长）等有真实用例时再扩展。
 */
export class ForRangeStatement implements IStatement
{
    readonly name: string;
    readonly from: number;
    readonly to: number;
    readonly statements: IStatement[] = [];
    private _wgslCache?: string;

    constructor(name: string, from: number, to: number)
    {
        this.name = name;
        this.from = from;
        this.to = to;
    }

    /**
     * 挂一条语句到循环体
     *
     * @param statement 语句
     */
    addStatement(statement: IStatement): void
    {
        this.statements.push(statement);
    }

    toGLSL(): string
    {
        return this._build(
            `for (int ${this.name} = ${this.from}; ${this.name} < ${this.to}; ${this.name}++)`,
            (s) => s.toGLSL(),
        );
    }

    toWGSL(): string
    {
        if (this._wgslCache !== undefined) return this._wgslCache;

        this._wgslCache = this._build(
            `for (var ${this.name} = ${this.from}; ${this.name} < ${this.to}; ${this.name} = ${this.name} + 1)`,
            (s) => s.toWGSL(),
        );

        return this._wgslCache;
    }

    private _build(head: string, render: (s: IStatement) => string): string
    {
        const lines: string[] = [`${head} {`];
        for (const statement of this.statements)
        {
            const code = render(statement);
            if (code.trim()) lines.push(...code.split('\n').map((l) => `    ${l}`));
        }
        lines.push('}');

        return lines.join('\n');
    }
}

/**
 * for 循环：`for (var <name> = <from>; <name> < <to>; <name> = <name> + 1)`。
 *
 * @param name 循环变量名
 * @param from 起始值（含）
 * @param to 结束值（不含）
 * @param body 循环体（参数是循环变量，可在其中做数组索引）
 *
 * @example
 * ```typescript
 * forRange_('i', 0, 4, (i) => {
 *     total.assign(total.add(matrices.index(i).multiply(position)));
 * });
 * ```
 */
export function forRange_(name: string, from: number, to: number, body: (i: Int) => void): void
{
    const loopVar = new Int();
    loopVar.toGLSL = () => name;
    loopVar.toWGSL = () => name;
    loopVar.dependencies = [];

    const forStatement = new ForRangeStatement(name, from, to);

    // 挂到当前最近的语句容器：for 体 > if 体 > 函数体
    const currentForStatement = getCurrentForStatement();
    const currentIfStatement = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentForStatement)
    {
        currentForStatement.addStatement(forStatement);
    }
    else if (currentIfStatement)
    {
        currentIfStatement.addStatement(forStatement);
    }
    else if (currentFunc)
    {
        currentFunc.statements.push(forStatement);
    }

    // 循环变量的名字不算依赖（它不是 ShaderValue），只收集循环体里的依赖

    pushForStatement(forStatement);
    body(loopVar);
    popForStatement();
}
