import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';
import { getCurrentForStatement, pushForStatement, popForStatement } from '../core/forStack';
import { Int } from '../types/scalar/int';
import { UInt } from '../types/scalar/uint';
import type { ShaderValue } from '../core/IElement';

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

/**
 * `for` 循环语句（**运行期上界**）：
 * ```wgsl
 * for (var <name>: u32 = <from>u; <name> < <count>; <name> = <name> + 1u) { ... }
 * ```
 *
 * 与 {@link ForRangeStatement} 的区别：上界是**运行期值**（如 `u32(clamp(lights.u_pointLightCount, 0.0, 8.0))`），
 * 不能构建期展开。手写的点光源循环正是这个形态。
 */
export class ForU32Statement implements IStatement
{
    readonly name: string;
    readonly from: number;
    readonly count: ShaderValue;
    readonly statements: IStatement[] = [];
    private _wgslCache?: string;

    constructor(name: string, from: number, count: ShaderValue)
    {
        this.name = name;
        this.from = from;
        this.count = count;
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
            `for (uint ${this.name} = ${this.from}u; ${this.name} < ${this.count.toGLSL()}; ${this.name}++)`,
            (s) => s.toGLSL(),
        );
    }

    toWGSL(): string
    {
        if (this._wgslCache !== undefined) return this._wgslCache;

        this._wgslCache = this._build(
            `for (var ${this.name}: u32 = ${this.from}u; ${this.name} < ${this.count.toWGSL()}; ${this.name} = ${this.name} + 1u)`,
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
 * `for` 循环（运行期 u32 上界）。
 *
 * @param name 循环变量名
 * @param from 起始值（含，非负整数）
 * @param count 上界（**运行期** u32 值，不含）
 * @param body 循环体（参数是循环变量，可用于索引）
 */
export function forU32_(name: string, from: number, count: ShaderValue, body: (i: UInt) => void): void
{
    const loopVar = new UInt();
    loopVar.toGLSL = () => name;
    loopVar.toWGSL = () => name;
    loopVar.dependencies = [];

    const forStatement = new ForU32Statement(name, from, count);

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

    // **循环上界表达式的依赖也要收集**——否则上界里用到的 uniform/storage 不会被声明
    // （如 config.numLights：漏了它生成的 WGSL 会引用未声明的 config）
    if (currentFunc)
    {
        currentFunc.dependencies.push(count);
    }

    pushForStatement(forStatement as unknown as ForRangeStatement);
    body(loopVar);
    popForStatement();
}
