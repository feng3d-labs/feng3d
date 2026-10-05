import { ExternalVarMeta, ShaderValue } from '../core/IElement';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentForStatement } from '../core/forStack';
import { getCurrentIfStatement } from '../core/ifStack';
import { Float } from '../types/scalar/float';
import { checkWGSLReservedKeyword } from '../utils/wgslKeywords';
import { Array } from './array';

/**
 * 创建一个带变量名的表达式（用于 WGSL 中的 var 语句）
 * @param name 变量名
 * @param expr 表达式或字面值，或类型构造函数（用于声明未初始化的变量）
 * @returns 设置了变量名的表达式实例
 */
export function var_<T extends ShaderValue>(name: string, expr: T): T;
export function var_<T extends ShaderValue>(name: string, type: (() => T)): T;
export function var_(name: string, expr: number): Float;
export function var_(name: string, expr: ShaderValue | (() => ShaderValue) | number): ShaderValue
{
    // 检查是否是 WGSL 保留关键字
    checkWGSLReservedKeyword(name);

    let result: ShaderValue;

    // 如果第二个参数是数字，自动转换为 Float
    if (typeof expr === 'number')
    {
        const numExpr = new Float(expr);
        result = new Float();
        result.toGLSL = () => `${name}`;
        result.toWGSL = () => `${name}`;
        result.dependencies = [numExpr];

        addStatement(name, result, numExpr, false);
    }
    // 如果第二个参数是函数（类型构造函数），创建未初始化的变量
    else if (typeof expr === 'function')
    {
        result = expr();

        // 如果是 Array 实例，设置变量名
        if (result instanceof Array)
        {
            result._setVarName(name);
        }
        else
        {
            result.toGLSL = () => `${name}`;
            result.toWGSL = () => `${name}`;
        }
        result.dependencies = [];

        addStatement(name, result, result, true);
    }
    // 否则是表达式
    else
    {
        // 如果是 Array 实例，直接使用并设置变量名
        if (expr instanceof Array)
        {
            expr._setVarName(name);
            result = expr;
        }
        else
        {
            const cls = expr.constructor;
            result = new (cls as new () => ShaderValue)();
            result.toGLSL = () => `${name}`;
            result.toWGSL = () => `${name}`;
            result.dependencies = [expr];
        }

        addStatement(name, result, expr, false);
    }

    return result;
}

function addStatement(name: string, result: ShaderValue, expr: ShaderValue, isTypeOnly: boolean): void
{
    const currentFunc = getCurrentFunc();
    if (currentFunc)
    {
        let stmt: { toGLSL: () => string; toWGSL: () => string };

        // 如果是数组类型
        if (expr instanceof Array)
        {
            const arrLength = expr.length;
            stmt = isTypeOnly
                ? {
                    toGLSL: () => `${expr.glslType} ${name}[${arrLength}];`,
                    toWGSL: () => `var ${name}: array<${expr.wgslType}, ${arrLength}>;`,
                }
                : {
                    toGLSL: () => `${expr.glslType} ${name}[${arrLength}];`,
                    toWGSL: () => `var ${name}: array<${expr.wgslType}, ${arrLength}>;`,
                };
        }
        else
        {
            stmt = isTypeOnly
                ? {
                    toGLSL: () => `${expr.glslType} ${name};`,
                    toWGSL: () => `var ${name}: ${expr.wgslType};`,
                }
                : {
                    toGLSL: () => `${expr.glslType} ${name} = ${expr.toGLSL()};`,
                    toWGSL: () => `var ${name} = ${expr.toWGSL()};`,
                };
        }

        // 挂到当前最近的语句容器：for 体 > if 体 > 函数体
        const currentForStatement = getCurrentForStatement();
        const currentIfStatement = getCurrentIfStatement();
        if (currentForStatement)
        {
            currentForStatement.addStatement(stmt);
        }
        else if (currentIfStatement)
        {
            // 在 if 体中时用 addStatement 自动判断添加到 if 体还是 else 体
            currentIfStatement.addStatement(stmt);
        }
        else
        {
            currentFunc.statements.push(stmt);
        }
        // 收集依赖
        currentFunc.dependencies.push(result);
    }
    else
    {
        // 在函数外部定义，标记为外部变量并保存初始化信息
        const extVar = result as ShaderValue & ExternalVarMeta;
        extVar._isExternalVar = true;
        extVar._varName = name;
        extVar._varExpr = expr;
        extVar._isTypeOnly = isTypeOnly;
    }
}