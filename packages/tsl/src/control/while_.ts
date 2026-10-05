import { IStatement } from '../core/Statement';
import { Bool } from '../types/scalar/bool';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement, pushForStatement, popForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';
import { buildShader } from '../core/buildShader';

/**
 * 剥掉表达式最外层的**成对**括号（只剥一层，且必须整串被这一对包住）。
 *
 * 起因：`UInt` 的比较（equals / lessThan / greaterThan）生成的是 `(a < b)`——
 * `Float` 的同名比较则**不带**括号，两者不一致。若原样拼进 `while (...)` 会得到
 * `while ((a < b))`。这里做一次最小纠正，**不改 `UInt` 本身**（那会影响已有的
 * 大量断言，风险面太大）。该不一致已记录在 issue #712 里待统一。
 *
 * @param expr 表达式文本
 * @returns 剥掉最外层成对括号后的文本
 */
function stripOuterParens(expr: string): string
{
    if (!expr.startsWith('(') || !expr.endsWith(')')) return expr;

    // 确认这一对括号是"整串的"（第一个 '(' 与最后一个 ')' 配对），而不是 (a) && (b)
    let depth = 0;
    for (let i = 0; i < expr.length; i++)
    {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')')
        {
            depth--;
            if (depth === 0 && i !== expr.length - 1) return expr;
        }
    }

    return expr.slice(1, -1);
}

/**
 * `while` 循环语句：`while (<condition>) { ... }`
 *
 * 条件是个**回调**——每次生成时求值，这样条件里引用的变量（如 `elementIndex`）
 * 能拿到最新的表达式。
 */
export class WhileStatement implements IStatement
{
    readonly condition: () => Bool;
    readonly statements: IStatement[] = [];

    constructor(condition: () => Bool)
    {
        this.condition = condition;
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
        return `while (${stripOuterParens(this.condition().toGLSL())}) {\n${this._bodyLines('toGLSL')}\n}`;
    }

    toWGSL(): string
    {
        return `while (${stripOuterParens(this.condition().toWGSL())}) {\n${this._bodyLines('toWGSL')}\n}`;
    }

    /**
     * 循环体文本（每条语句的每一行缩进 4 空格——与 generateWGSLStatements 的惯例一致）
     *
     * @param method 取 GLSL 还是 WGSL
     * @returns 缩进后的循环体文本
     */
    private _bodyLines(method: 'toGLSL' | 'toWGSL'): string
    {
        const lines: string[] = [];
        for (const stmt of this.statements)
        {
            for (const line of stmt[method]().split('\n'))
            {
                lines.push(`    ${line}`);
            }
        }

        return lines.join('\n');
    }
}

/**
 * `while` 循环（条件在运行期反复求值）。
 *
 * 与 forRange_ / forU32_ 一样挂到"当前最近的语句容器"（while 体 > for 体 > if 体 > 函数体）。
 *
 * @param condition 条件（回调，每次生成时求值）
 * @param body 循环体
 */
export function while_(condition: () => Bool, body: () => void): void
{
    const whileStatement = new WhileStatement(condition);

    const currentForStatement = getCurrentForStatement();
    const currentIfStatement = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentForStatement)
    {
        currentForStatement.addStatement(whileStatement);
    }
    else if (currentIfStatement)
    {
        currentIfStatement.addStatement(whileStatement);
    }
    else if (currentFunc)
    {
        currentFunc.statements.push(whileStatement);
    }

    pushForStatement(whileStatement);
    body();
    popForStatement();
}

/** 供 buildShader 的类型推断使用（避免未使用告警） */
void buildShader;
