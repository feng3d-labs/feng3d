import { ShaderValue } from './IElement';

/**
 * 为 swizzle 操作包裹括号（如果需要）
 * 规则：如果表达式包含运算符（非函数调用），则需要括号
 * 例如：`mvNormal * vec4(normal, 0.0)` -> `(mvNormal * vec4(normal, 0.0))`
 */
export function wrapForSwizzle(expr: string): string
{
    // 如果是简单标识符，不需要括号
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr))
    {
        return expr;
    }

    // 如果已经被括号包裹，不需要额外括号
    if (expr.startsWith('(') && expr.endsWith(')'))
    {
        // 验证括号是否匹配（整个表达式被一对括号包裹）
        let depth = 0;
        for (let i = 0; i < expr.length; i++)
        {
            if (expr[i] === '(') depth++;
            else if (expr[i] === ')') depth--;
            // 如果在最后一个字符前深度就变为0，说明括号没有包裹整个表达式
            if (depth === 0 && i < expr.length - 1)
            {
                break;
            }
        }
        if (depth === 0)
        {
            return expr;
        }
    }

    // 如果是函数调用（如 vec4(...), normalize(...)），不需要括号
    const functionCallMatch = /^[a-zA-Z_][a-zA-Z0-9_<>]*\s*\(/.exec(expr);
    if (functionCallMatch)
    {
        let depth = 0;
        let i = functionCallMatch[0].length - 1;
        for (; i < expr.length; i++)
        {
            if (expr[i] === '(') depth++;
            else if (expr[i] === ')') depth--;
            if (depth === 0)
            {
                // 如果到达表达式末尾，说明是纯函数调用
                if (i === expr.length - 1)
                {
                    return expr;
                }
                break;
            }
        }
    }

    // 如果包含运算符，需要括号
    // 检查是否有顶层运算符（不在括号内的运算符）
    let depth = 0;
    for (let i = 0; i < expr.length; i++)
    {
        const char = expr[i];
        if (char === '(' || char === '[') depth++;
        else if (char === ')' || char === ']') depth--;
        else if (depth === 0 && (char === '+' || char === '-' || char === '*' || char === '/' || char === '%'))
        {
            // 排除负数的情况（如果 - 在表达式开头或在运算符后面）
            if (char === '-' && (i === 0 || /[+\-*/%([]/.test(expr[i - 1])))
            {
                continue;
            }

            // 发现顶层运算符，需要括号
            return `(${expr})`;
        }
    }

    return expr;
}

/**
 * 检测表达式字符串是否包含运算符
 */
function hasOperator(expr: string): boolean
{
    // 首先检查是否是数字字面量（包括科学计数法）
    // 科学计数法格式：1e-17, 1E-17, 1.5e+17 等
    if (/^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(expr))
    {
        // 是科学计数法，不包含运算符
        return false;
    }

    // 检查是否是普通数字字面量（包括负数）
    if (/^-?\d+(\.\d+)?$/.test(expr))
    {
        // 是数字字面量，不包含运算符
        return false;
    }

    // 检查是否是函数调用（如 max(...), exp(...)）
    // 函数调用格式：identifier(...)，但必须是完整的表达式（没有其他运算符）
    // 如果表达式以函数调用开头，但后面还有其他内容，则不是纯函数调用
    const functionCallMatch = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.exec(expr);
    if (functionCallMatch)
    {
        // 检查是否是完整的函数调用（从开头到结尾都是函数调用）
        // 通过匹配括号来验证
        let depth = 0;
        let i = functionCallMatch[0].length - 1;
        for (; i < expr.length; i++)
        {
            if (expr[i] === '(') depth++;
            else if (expr[i] === ')') depth--;
            if (depth === 0)
            {
                // 括号匹配完成
                // 如果到达表达式末尾，说明是纯函数调用
                if (i === expr.length - 1)
                {
                    return false;
                }
                // 如果还有后续内容，说明不是纯函数调用
                break;
            }
        }
    }

    // 检查是否包含运算符（排除函数调用中的括号）
    // 简单检查：如果包含 +、-、*、/、% 运算符
    return /[+\-*/%]/.test(expr);
}

/**
 * 检测表达式是否包含加减运算符
 */
function hasAddSubOperator(expr: string): boolean
{
    return /[+-]/.test(expr);
}

/**
 * 检测表达式是否包含乘除运算符
 */
export function hasMulDivOperator(expr: string): boolean
{
    // eslint-disable-next-line no-useless-escape
    return /[*\/%]/.test(expr);
}

/**
 * 检测表达式的顶层运算符类型
 * 返回 'addsub' | 'muldiv' | null
 */
function getTopLevelOperator(expr: string): 'addsub' | 'muldiv' | null
{
    if (!hasOperator(expr))
    {
        return null;
    }

    // 简单检测：如果同时包含加减和乘除，根据优先级，顶层应该是加减
    // 如果只有乘除，顶层是乘除
    // 如果只有加减，顶层是加减
    const hasAddSub = hasAddSubOperator(expr);
    const hasMulDiv = hasMulDivOperator(expr);

    if (hasAddSub && hasMulDiv)
    {
        // 同时包含加减和乘除，需要更精确的检测
        // 由于乘除优先级更高，如果表达式包含乘除，顶层可能是加减（如果加减在外层）
        // 这里使用简单规则：如果同时存在，假设顶层是加减（因为乘除会被括号包裹）
        return 'addsub';
    }
    else if (hasAddSub)
    {
        return 'addsub';
    }
    else if (hasMulDiv)
    {
        return 'muldiv';
    }

    return null;
}

/**
 * 为表达式添加括号（如果需要）
 */
function wrapWithParens(expr: string, needsParens: boolean): string
{
    return needsParens ? `(${expr})` : expr;
}

/**
 * 格式化操作数，根据运算符优先级决定是否需要括号
 * @param operand 操作数
 * @param currentOp 当前运算符 ('+', '-', '*', '/')
 * @param isLeftOperand 是否是左操作数
 * @param toCode 转换为代码的函数
 */
export function formatOperand(
    operand: ShaderValue | number,
    currentOp: '+' | '-' | '*' | '/' | '%',
    isLeftOperand: boolean,
    toCode: () => string,
): string
{
    if (typeof operand === 'number')
    {
        return operand.toString();
    }

    const operandStr = toCode();
    const hasOp = hasOperator(operandStr);
    if (!hasOp)
    {
        // 没有运算符，不需要括号
        return operandStr;
    }

    const operandTopOp = getTopLevelOperator(operandStr);
    const hasAddSub = hasAddSubOperator(operandStr);
    const hasMulDiv = hasMulDivOperator(operandStr);

    let needsParens = false;

    if (currentOp === '+')
    {
        // 加法：左结合，同级不需要括号
        // 如果操作数是乘除表达式，不需要括号（乘除优先级更高，会自动先计算）
        // 如果操作数是加减表达式，不需要括号（同级，左结合）
    }
    else if (currentOp === '-')
    {
        // 减法：左结合
        // 左操作数：如果是加减表达式，不需要括号（同级，左结合）
        // 右操作数：如果是加减表达式，需要括号（因为 a - (b + c) ≠ a - b + c）
        //           如果是乘除表达式，不需要括号（乘除优先级更高）
        if (isLeftOperand)
        {
            // 左操作数：如果操作数是乘除表达式，不需要括号（乘除优先级更高）
            // 如果操作数是加减表达式，不需要括号（同级，左结合）
        }
        else
        {
            // 右操作数：如果操作数是加减表达式，需要括号
            if (operandTopOp === 'addsub')
            {
                needsParens = true;
            }
            // 如果操作数是乘除表达式，不需要括号（乘除优先级更高）
        }
    }
    else if (currentOp === '*')
    {
        // 乘法：左结合，同级不需要括号
        // 如果操作数是加减表达式，需要括号（优先级更低）
        if (operandTopOp === 'addsub')
        {
            needsParens = true;
        }
        // 如果操作数是乘除表达式，不需要括号（同级，左结合）
    }
    else if (currentOp === '/')
    {
        // 除法：左结合
        // 左操作数：如果是乘除表达式，不需要括号（同级，左结合）
        // 右操作数：如果是任何表达式，都需要括号（因为 a / (b * c) ≠ a / b * c）
        if (isLeftOperand)
        {
            // 左操作数：如果操作数是加减表达式，需要括号
            if (operandTopOp === 'addsub')
            {
                needsParens = true;
            }
        }
        else
        {
            // 右操作数：如果是任何表达式，都需要括号
            needsParens = true;
        }
    }
    else if (currentOp === '%')
    {
        // 取模：左结合，与 * / 优先级相同
        // 左操作数：如果是加减表达式，需要括号
        // 右操作数：如果是任何表达式，都需要括号（因为 a % (b * c) ≠ a % b * c）
        if (isLeftOperand)
        {
            // 左操作数：如果操作数是加减表达式，需要括号
            if (operandTopOp === 'addsub')
            {
                needsParens = true;
            }
        }
        else
        {
            // 右操作数：如果是任何表达式，都需要括号
            needsParens = true;
        }
    }

    return wrapWithParens(operandStr, needsParens);
}
