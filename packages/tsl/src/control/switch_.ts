import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement, pushForStatement, popForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';
import { ShaderValue } from '../core/IElement';
import { UInt } from '../types/scalar/uint';
import { Int } from '../types/scalar/int';

/** switch 的一个分支（case 或 default） */
interface SwitchCase
{
    /** case 的值；default 分支为 undefined */
    value?: number;
    statements: IStatement[];
}

/**
 * `switch` 语句：`switch (<selector>) { case <v>: { ... } default: { ... } }`
 *
 * WGSL 的 switch **不会贯穿**（不需要 break），所以这里也不生成 break。
 */
export class SwitchStatement implements IStatement
{
    readonly selector: ShaderValue | number;
    readonly cases: SwitchCase[] = [];
    private _current: SwitchCase | null = null;

    constructor(selector: ShaderValue | number)
    {
        this.selector = selector;
    }

    /**
     * 开一个 case 分支（后续语句挂到它上面）
     *
     * @param value case 的值
     */
    openCase(value: number): void
    {
        this._current = { value, statements: [] };
        this.cases.push(this._current);
    }

    /**
     * 开 default 分支
     */
    openDefault(): void
    {
        this._current = { statements: [] };
        this.cases.push(this._current);
    }

    /**
     * 挂一条语句到**当前分支**
     *
     * @param statement 语句
     */
    addStatement(statement: IStatement): void
    {
        if (this._current)
        {
            this._current.statements.push(statement);
        }
    }

    /**
     * 生成分支文本
     *
     * @param method 取 GLSL 还是 WGSL
     * @returns 分支行
     */
    private _caseLines(method: 'toGLSL' | 'toWGSL'): string
    {
        const lines: string[] = [];
        for (const c of this.cases)
        {
            const head = c.value === undefined ? 'default' : `case ${c.value}`;
            lines.push(`    ${head}: {`);
            for (const stmt of c.statements)
            {
                for (const line of stmt[method]().split('\n'))
                {
                    lines.push(`        ${line}`);
                }
            }
            lines.push('    }');
        }

        return lines.join('\n');
    }

    toGLSL(): string
    {
        const selector = typeof this.selector === 'number' ? `${this.selector}` : this.selector.toGLSL();

        return `switch (${selector}) {\n${this._caseLines('toGLSL')}\n}`;
    }

    toWGSL(): string
    {
        const selector = typeof this.selector === 'number' ? `${this.selector}` : this.selector.toWGSL();

        return `switch (${selector}) {\n${this._caseLines('toWGSL')}\n}`;
    }
}

/** switch 分支构建器 */
export interface SwitchBuilder
{
    /**
     * 一个 case 分支
     *
     * @param value 分支值
     * @param body 分支体
     */
    case_(value: number, body: () => void): SwitchBuilder;
    /**
     * default 分支
     *
     * @param body 分支体
     */
    default_(body: () => void): SwitchBuilder;
}

/**
 * `switch` 语句（WGSL 的 switch 不贯穿，无需 break）。
 *
 * 用法：
 * ```ts
 * switch_(renderMode, (sw) =>
 * {
 *     sw.case_(1, () => { return_(joints); });
 *     sw.case_(2, () => { return_(weights); });
 *     sw.default_(() => { return_(vec4(1.0, 0.0, 0.0, 1.0)); });
 * });
 * ```
 *
 * @param selector 选择值（u32 / i32 或字面量）
 * @param build 分支构建回调
 */
export function switch_(selector: UInt | Int | number, build: (sw: SwitchBuilder) => void): void
{
    const switchStatement = new SwitchStatement(selector);

    // 挂到"当前最近的语句容器"
    const currentFor = getCurrentForStatement();
    const currentIf = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentFor) currentFor.addStatement(switchStatement);
    else if (currentIf) currentIf.addStatement(switchStatement);
    else if (currentFunc) currentFunc.statements.push(switchStatement);

    // 选择值本身可能是 uniform 成员访问，必须收集依赖
    if (currentFunc && typeof selector !== 'number')
    {
        currentFunc.dependencies.push(selector);
    }

    const builder: SwitchBuilder = {
        case_(value: number, body: () => void): SwitchBuilder
        {
            switchStatement.openCase(value);
            pushForStatement(switchStatement);
            body();
            popForStatement();

            return builder;
        },
        default_(body: () => void): SwitchBuilder
        {
            switchStatement.openDefault();
            pushForStatement(switchStatement);
            body();
            popForStatement();

            return builder;
        },
    };

    build(builder);
}
