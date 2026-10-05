import { getBuildParam } from '../core/buildShader';
import { ShaderValue } from '../core/IElement';
import { IStatement } from '../core/Statement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';
import { getCurrentForStatement } from '../core/forStack';

/**
 * 带标记的语句（用于在语句上附加元数据）
 *
 * 这些标记字段由 return_/vertex 自动设置，供 vertex/fragment/transform 识别语句类型。
 */
export interface IMarkedStatement extends IStatement
{
    /** return 语句的原始返回表达式（用于 fragment shader 自动创建结构体） */
    _returnExpr?: ShaderValue;
    /** 标记为 return 语句 */
    _isReturn?: boolean;
    /** 标记为自动生成的 var 声明语句（vertex） */
    _isAutoVarDeclaration?: boolean;
    /** 标记为自动生成的 return 语句（vertex） */
    _isAutoReturn?: boolean;
    /** 标记为自动生成的深度转换语句（vertex） */
    _isAutoDepthConvert?: boolean;
}

/**
 * return 语句——**无返回值**（compute 或 void 函数的提前返回）。
 *
 * 生成 `return;`
 */
export function return_(): void;
/**
 * return 语句——带返回值（顶点 / 片元入口会额外处理 gl_Position / 输出变量）
 *
 * @param expr 返回值表达式
 */
export function return_(expr: ShaderValue): void;
export function return_<T extends ShaderValue>(expr?: T): void;
export function return_<T extends ShaderValue>(expr?: T): void
{
    const currentFunc = getCurrentFunc();

    // 无返回值：生成裸 "return;"（compute 的越界提前返回就是这种）
    if (expr === undefined)
    {
        const currentFor = getCurrentForStatement();
        const currentIf = getCurrentIfStatement();
        const bareReturn = {
            toGLSL: () => 'return;',
            toWGSL: () => 'return;',
        };

        // 必须挂到"当前最近的语句容器"，否则在 if / for 里写 return_() 会被提到外层
        // （探针发现：if 变成空体、return 跑到了外面）
        if (currentFor) currentFor.addStatement(bareReturn);
        else if (currentIf) currentIf.addStatement(bareReturn);
        else if (currentFunc) currentFunc.statements.push(bareReturn);

        return;
    }

    if (currentFunc)
    {
        const stmt: IMarkedStatement = {
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

