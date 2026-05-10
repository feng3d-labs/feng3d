import { getBuildParam } from '../core/buildShader';
import { IElement, ShaderValue } from '../core/IElement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';

/**
 * 创建一个 return 语句（用于函数返回值）
 * @param expr 返回值表达式
 * @returns 返回值表达式（原样返回，用于链式调用）
 */
export function return_<T extends ShaderValue>(expr: T): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        const stmt: any = {
            toGLSL: () =>
            {
                const buildParam = getBuildParam();
                const version = buildParam.version;
                const stage = buildParam.stage;

                // 辅助函数中使用普通的 return 语句
                if (buildParam.isHelperFunction)
                {
                    return `return ${expr.toGLSL()};`;
                }

                if (stage === 'vertex')
                {
                    return `gl_Position = ${expr.toGLSL()}; return;`;
                }
                else if (stage === 'fragment')
                {
                    if (version === 2)
                    {
                        // WebGL 2.0 使用 layout(location = 0) out vec4 color;
                        return `color = ${expr.toGLSL()}; return;`;
                    }
                    else
                    {
                        return `gl_FragColor = ${expr.toGLSL()}; return;`;
                    }
                }

                return `return ${expr.toGLSL()};`;
            },
            toWGSL: () =>
            {
                const buildParam = getBuildParam();

                // 辅助函数中使用普通的 return 语句
                if (buildParam.isHelperFunction)
                {
                    return `return ${expr.toWGSL()};`;
                }

                // 在顶点着色器中，如果启用了深度转换，将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]
                if (buildParam.stage === 'vertex' && buildParam.convertDepth)
                {
                    const exprWgsl = expr.toWGSL();

                    // 使用临时变量避免重复计算
                    return `let _pos_temp = ${exprWgsl}; return vec4<f32>(_pos_temp.xy, (_pos_temp.z + 1.0) * 0.5, _pos_temp.w);`;
                }

                return `return ${expr.toWGSL()};`;
            },
        };

        // 保存原始表达式，用于 fragment shader 中自动创建结构体
        stmt._returnExpr = expr;
        // 标记这是一个 return 语句，用于 fragment.ts 检查
        stmt._isReturn = true;

        // 检查是否在 if 语句体中
        const currentIfStatement = getCurrentIfStatement();
        if (currentIfStatement)
        {
            // 如果在 if 语句体中，使用 addStatement 自动判断添加到 if 体还是 else 体
            currentIfStatement.addStatement(stmt);
        }
        else
        {
            // 否则将语句添加到当前函数的 statements 中
            currentFunc.statements.push(stmt);
        }
        currentFunc.dependencies.push(expr);
    }
}

