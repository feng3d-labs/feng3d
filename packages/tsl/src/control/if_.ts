import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { Bool } from '../types/scalar/bool';
import { IElement } from '../core/IElement';
import { getCurrentIfStatement, pushIfStatement, popIfStatement } from '../core/ifStack';

/**
 * if_ 返回值接口，支持链式调用 else
 */
export interface IfResult
{
    /**
     * else 分支
     * @param body else 分支执行的回调函数
     */
    else(body: () => void): void;
}

/**
 * if_ 函数，用于条件判断
 * @param condition 条件表达式
 * @param body 条件满足时执行的回调函数
 * @returns 支持链式调用 else 的对象
 */
export function if_(condition: Bool, body: () => void): IfResult
{
    // 创建一个IfStatement实例，用于生成条件判断代码
    const ifStatement = new IfStatement(condition);

    // 将语句添加到当前函数的 statements 中
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        // 检查当前是否在if语句体中
        const currentIfStatement = getCurrentIfStatement();
        if (currentIfStatement)
        {
            // 如果当前在if语句体中，将新的if语句添加到当前if语句的statements中
            currentIfStatement.statements.push(ifStatement);
        }
        else
        {
            // 否则将新的if语句添加到当前函数的statements中
            currentFunc.statements.push(ifStatement);
        }
        // 收集条件表达式的依赖
        currentFunc.dependencies.push(condition);

        // 执行回调函数，收集要执行的语句
        pushIfStatement(ifStatement); // 将当前if语句推入堆栈
        ifStatement.beginBody();
        body();
        ifStatement.endBody();
        popIfStatement(); // 从堆栈中移除当前if语句
    }

    // 返回支持链式调用的对象
    return {
        else(elseBody: () => void): void
        {
            if (currentFunc)
            {
                pushIfStatement(ifStatement);
                ifStatement.beginElseBody();
                elseBody();
                ifStatement.endElseBody();
                popIfStatement();
            }
        },
    };
}

/**
 * IfStatement 类，用于表示 if 语句
 */
export class IfStatement implements IStatement
{
    readonly condition: Bool;
    readonly statements: IStatement[] = [];
    readonly elseStatements: IStatement[] = [];
    private isBodyActive = false;
    private isElseBodyActive = false;
    private _wgslCache?: string; // 缓存 WGSL 结果，避免重复计算和警告

    constructor(condition: Bool)
    {
        this.condition = condition;
    }

    /**
     * 开始收集if语句体
     */
    beginBody(): void
    {
        this.isBodyActive = true;
    }

    /**
     * 结束收集if语句体
     */
    endBody(): void
    {
        this.isBodyActive = false;
    }

    /**
     * 开始收集else语句体
     */
    beginElseBody(): void
    {
        this.isElseBodyActive = true;
    }

    /**
     * 结束收集else语句体
     */
    endElseBody(): void
    {
        this.isElseBodyActive = false;
    }

    /**
     * 添加语句到if语句体
     */
    addStatement(statement: IStatement): void
    {
        if (this.isBodyActive)
        {
            this.statements.push(statement);
        }
        else if (this.isElseBodyActive)
        {
            this.elseStatements.push(statement);
        }
    }

    toGLSL(): string
    {
        const conditionStr = this.condition.toGLSL();
        // 为每个语句生成代码，并处理多行语句的缩进
        const bodyLines: string[] = [];
        for (const statement of this.statements)
        {
            const stmtStr = statement.toGLSL();
            // 如果语句包含多行，为每行添加缩进
            const lines = stmtStr.split('\n');
            for (const line of lines)
            {
                bodyLines.push(`    ${line}`);
            }
        }

        let result = `if (${conditionStr}) {\n${bodyLines.join('\n')}\n}`;

        // 生成 else 分支代码
        if (this.elseStatements.length > 0)
        {
            const elseLines: string[] = [];
            for (const statement of this.elseStatements)
            {
                const stmtStr = statement.toGLSL();
                const lines = stmtStr.split('\n');
                for (const line of lines)
                {
                    elseLines.push(`    ${line}`);
                }
            }
            result += ` else {\n${elseLines.join('\n')}\n}`;
        }

        return result;
    }

    toWGSL(): string
    {
        // 使用缓存避免重复计算和警告
        if (this._wgslCache !== undefined)
        {
            return this._wgslCache;
        }

        const conditionStr = this.condition.toWGSL();

        // 收集所有语句的 WGSL 代码
        const ifBodyStmts: string[] = [];
        for (const statement of this.statements)
        {
            ifBodyStmts.push(statement.toWGSL());
        }

        const elseBodyStmts: string[] = [];
        for (const statement of this.elseStatements)
        {
            elseBodyStmts.push(statement.toWGSL());
        }

        // 检测并提取 textureSample 调用（WGSL 限制：textureSample 必须在 uniform control flow 中）
        const textureSampleRegex = /textureSample\s*\([^)]+\)/g;
        const hoistedSamples: Map<string, string> = new Map(); // textureSample 调用 -> 临时变量名
        let sampleIndex = 0;

        const extractTextureSamples = (code: string): string =>
        {
            return code.replace(textureSampleRegex, (match) =>
            {
                // 检查是否已经提取过相同的调用
                if (hoistedSamples.has(match))
                {
                    return hoistedSamples.get(match)!;
                }
                // 创建新的临时变量
                const tempVar = `_ts${sampleIndex++}`;
                hoistedSamples.set(match, tempVar);

                return tempVar;
            });
        };

        // 处理 if 体和 else 体中的 textureSample 调用
        const processedIfStmts = ifBodyStmts.map(stmt => extractTextureSamples(stmt));
        const processedElseStmts = elseBodyStmts.map(stmt => extractTextureSamples(stmt));

        // 如果有 textureSample 被提取，输出警告
        if (hoistedSamples.size > 0)
        {
            const sampleCalls = Array.from(hoistedSamples.keys()).map(call => `  - ${call}`).join('\n');
            console.warn(
                `[TSL] WGSL 限制：if 语句中检测到 ${hoistedSamples.size} 个 textureSample 调用，已自动移至 if 语句前。\n` +
                `条件: ${conditionStr}\n` +
                `涉及的采样调用:\n${sampleCalls}\n` +
                `建议: 请手动将 texture() 调用移至 if 语句外部，以避免此警告。`,
            );
        }

        // 构建结果
        const resultLines: string[] = [];

        // 添加提取的 textureSample 声明
        for (const [sampleCall, varName] of hoistedSamples)
        {
            resultLines.push(`let ${varName} = ${sampleCall};`);
        }

        // 生成 if 体代码
        const bodyLines: string[] = [];
        for (const stmtStr of processedIfStmts)
        {
            const lines = stmtStr.split('\n');
            for (const line of lines)
            {
                bodyLines.push(`    ${line}`);
            }
        }

        let ifCode = `if (${conditionStr}) {\n${bodyLines.join('\n')}\n}`;

        // 生成 else 分支代码
        if (processedElseStmts.length > 0)
        {
            const elseLines: string[] = [];
            for (const stmtStr of processedElseStmts)
            {
                const lines = stmtStr.split('\n');
                for (const line of lines)
                {
                    elseLines.push(`    ${line}`);
                }
            }
            ifCode += ` else {\n${elseLines.join('\n')}\n}`;
        }

        resultLines.push(ifCode);

        this._wgslCache = resultLines.join('\n');

        return this._wgslCache;
    }
}
