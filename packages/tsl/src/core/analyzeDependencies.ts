import { Attribute } from '../variables/attribute';
import { FragColor } from '../glsl/fragColor';
import { Builtin } from '../glsl/builtin/builtin';
import { Precision } from '../glsl/precision';
import { Sampler } from '../glsl/sampler/sampler';
import { ShaderFunc } from '../shader/func';
import { StructDefinition } from '../variables/struct';
import { Uniform } from '../variables/uniform';
import { Varying } from '../variables/varying';
import { ShaderValue } from './IElement';

/**
 * 结构体 uniform 信息
 */
export interface StructUniformInfo
{
    uniform: Uniform;
    structDef: StructDefinition<any>;
    instanceName: string;
}

/**
 * 分析后的依赖结果接口
 */
export interface AnalyzedDependencies
{
    attributes: Set<Attribute>;
    uniforms: Set<Uniform>;
    precisions: Set<Precision>;
    varyings: Set<Varying>;
    samplers: Set<Sampler>;
    builtins: Set<Builtin>;
    fragColors: Set<FragColor>;
    externalVars: Array<{ name: string; expr: ShaderValue }>;
    structUniforms: StructUniformInfo[];
    shaderFuncs: Set<ShaderFunc<any, any>>;
}

/**
 * 分析函数依赖中使用的 attributes、uniforms、precision、structs、varyings、builtins 和外部变量
 * @param dependencies 函数依赖数组
 * @returns 使用的 Attribute、Uniform、Precision、VertexOutput/FragmentInput、Varying、Sampler、Builtin 和外部变量集合
 */
export function analyzeDependencies(dependencies: any[]): AnalyzedDependencies
{
    const attributes = new Set<Attribute>();
    const uniforms = new Set<Uniform>();
    const varyings = new Set<Varying>();
    const samplers = new Set<Sampler>();
    const builtins = new Set<Builtin>();
    const fragColors = new Set<FragColor>();
    const externalVars = new Map<string, { name: string; expr: ShaderValue }>();
    const precisions = new Set<Precision>();
    const structUniformsMap = new Map<Uniform, StructUniformInfo>();
    const shaderFuncs = new Set<ShaderFunc<any, any>>();
    const visited = new WeakSet();

    const analyzeValue = (value: any): void =>
    {
        if (value === null || value === undefined)
        {
            return;
        }

        // 避免重复访问同一个对象
        if (typeof value === 'object' && visited.has(value))
        {
            return;
        }
        if (typeof value === 'object')
        {
            visited.add(value);
        }

        // 如果是 Uniform 或 Attribute 实例，直接添加
        if (value instanceof Uniform)
        {
            uniforms.add(value);

            // 检查是否是结构体 uniform
            if (value.value && (value.value as any)._isStruct)
            {
                const structValue = value.value as any;
                structUniformsMap.set(value, {
                    uniform: value,
                    structDef: structValue._structDef,
                    instanceName: structValue._instanceName,
                });
            }

            return;
        }

        if (value instanceof Attribute)
        {
            attributes.add(value);

            return;
        }

        // 如果是 Precision 实例，添加到集合中
        if (value instanceof Precision)
        {
            precisions.add(value);

            return;
        }

        // 如果是 Varying 实例，添加到 varyings 集合
        if (value instanceof Varying)
        {
            varyings.add(value);

            return;
        }

        // 如果是 Sampler 实例，添加到 samplers 集合
        if (value instanceof Sampler)
        {
            samplers.add(value);

            return;
        }

        // 如果是 Builtin 实例，添加到 builtins 集合
        if (value instanceof Builtin)
        {
            builtins.add(value);

            return;
        }

        // 如果是 FragColor 实例，添加到 fragColors 集合
        if (value instanceof FragColor)
        {
            fragColors.add(value);

            return;
        }

        // 如果是 ShaderFunc 实例，添加到 shaderFuncs 集合
        if (value instanceof ShaderFunc)
        {
            shaderFuncs.add(value);
            // 继续分析 ShaderFunc 的依赖
            for (const dep of value.dependencies)
            {
                analyzeValue(dep);
            }

            return;
        }

        // 检查是否有 _shaderFunc 属性（函数调用表达式）
        if (typeof value === 'object' && (value as any)._shaderFunc instanceof ShaderFunc)
        {
            shaderFuncs.add((value as any)._shaderFunc);
            // 继续分析 ShaderFunc 的依赖
            for (const dep of (value as any)._shaderFunc.dependencies)
            {
                analyzeValue(dep);
            }
        }

        // 如果是外部定义的var_变量，收集它
        if (typeof value === 'object' && (value as any)._isExternalVar)
        {
            const varName = (value as any)._varName;
            const varExpr = (value as any)._varExpr;
            if (varName && varExpr && !externalVars.has(varName))
            {
                externalVars.set(varName, { name: varName, expr: varExpr });
            }
        }

        // 如果是 IElement 实例（Vec2, Vec4 等），分析其 dependencies
        if (typeof value === 'object' && 'dependencies' in value && Array.isArray(value.dependencies))
        {
            for (const dep of value.dependencies)
            {
                analyzeValue(dep);
            }
        }
    };

    // 分析所有依赖
    for (const dep of dependencies)
    {
        analyzeValue(dep);
    }

    return {
        attributes,
        uniforms,
        precisions,
        varyings,
        samplers,
        builtins,
        fragColors,
        externalVars: globalThis.Array.from(externalVars.values()),
        structUniforms: globalThis.Array.from(structUniformsMap.values()),
        shaderFuncs,
    };
}
