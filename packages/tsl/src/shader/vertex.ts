import { Attribute } from '../variables/attribute';
import { buildShader, getBuildParam } from '../core/buildShader';
import { Builtin } from '../glsl/builtin/builtin';
import { Func } from './func';
import { Sampler } from '../glsl/sampler/sampler';
import { Uniform } from '../variables/uniform';
import { Varying } from '../variables/varying';

/**
 * Vertex 类，继承自 Func
 */
export class Vertex extends Func
{
    constructor(name: string, body: () => void)
    {
        super(name, body);
    }

    /**
     * 转换为完整的 GLSL 代码（vertex shader）
     * @returns 完整的 GLSL 代码，包括 attributes、uniforms 和函数定义
     */
    toGLSL(version: 1 | 2 = 1): string
    {
        return buildShader({ language: 'glsl', stage: 'vertex', version: version }, () =>
        {
            const lines: string[] = [];

            // 添加版本声明（WebGL 2.0）
            if (version === 2)
            {
                lines.push('#version 300 es');
                lines.push('');
                lines.push('precision highp float;');
                lines.push('precision highp int;');
                lines.push('');
            }

            // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
            // 这里只为了收集依赖，不生成完整代码
            super.toGLSL();

            // 从函数的 dependencies 中分析获取 attributes、uniforms、varyings 和 samplers（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // 自动分配 location（对于 location 缺省的 attribute）
            this.allocateLocations(dependencies.attributes);

            // 生成 attributes（只包含实际使用的）
            for (const attr of dependencies.attributes)
            {
                lines.push(attr.toGLSL());
            }

            // 收集结构体 uniform 的名称
            const structUniformNames = new Set(dependencies.structUniforms.map(s => s.uniform.name));

            // 收集并生成所有嵌套结构体声明（去重）
            const generatedStructNames = new Set<string>();
            for (const structInfo of dependencies.structUniforms)
            {
                const nestedDefs = structInfo.structDef.getNestedStructDefinitions();
                for (const nestedDef of nestedDefs)
                {
                    if (!generatedStructNames.has(nestedDef.name))
                    {
                        lines.push(nestedDef.toGLSLStruct());
                        generatedStructNames.add(nestedDef.name);
                    }
                }
            }

            // 生成结构体 uniform（UBO 声明）
            for (const structInfo of dependencies.structUniforms)
            {
                lines.push(structInfo.structDef.toGLSLBlock(structInfo.instanceName));
            }

            // 生成普通 uniforms（排除结构体 uniform）
            for (const uniform of dependencies.uniforms)
            {
                if (!structUniformNames.has(uniform.name))
                {
                    lines.push(uniform.toGLSL());
                }
            }

            // 生成 samplers（纹理采样器声明）
            for (const sampler of dependencies.samplers)
            {
                lines.push(sampler.toGLSL());
            }

            // 生成 varying 声明
            for (const varying of dependencies.varyings)
            {
                lines.push(varying.toGLSL());
            }

            // 生成外部定义的var_变量（作为全局const）
            const externalVars = dependencies.externalVars;
            for (const { name, expr } of externalVars)
            {
                lines.push(`const ${expr.glslType} ${name} = ${expr.toGLSL()};`);
            }

            // 生成着色器函数定义
            for (const shaderFunc of dependencies.shaderFuncs)
            {
                lines.push('');
                lines.push(shaderFunc.toGLSL());
            }

            // 使用父类方法生成函数代码（不会再次执行 body，因为依赖已收集）
            const funcCode = super.toGLSL();
            const funcLines = funcCode.split('\n').filter(line => line.trim() !== '');

            // 如果有声明和函数代码，在它们之间添加一个空行
            if (lines.length > 0 && funcLines.length > 0)
            {
                lines.push('');
            }

            lines.push(...funcLines);

            // 移除末尾的空行，但保留其他空行（用于分隔）
            const result: string[] = [];
            for (let i = 0; i < lines.length; i++)
            {
                const line = lines[i];
                const isLast = i === lines.length - 1;
                // 如果是最后一行且为空，跳过
                if (isLast && line.trim() === '')
                {
                    continue;
                }
                result.push(line);
            }

            const resultStr = result.join('\n');

            return resultStr;
        });
    }

    /**
     * 转换为完整的 WGSL 代码（vertex shader）
     * @param options 可选参数
     * @param options.convertDepth 是否转换深度值，将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]（默认 false）
     * @returns 完整的 WGSL 代码，包括 uniforms、attributes 和函数定义
     */
    toWGSL(options?: { convertDepth?: boolean }): string
    {
        const convertDepth = options?.convertDepth ?? false;

        return buildShader({ language: 'wgsl', stage: 'vertex', version: 1, convertDepth }, () =>
        {
            const lines: string[] = [];

            // 执行 body 收集依赖
            this.executeBodyIfNeeded();

            // 从函数的 dependencies 中分析获取 attributes、uniforms（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // 自动分配 location（对于 location 缺省的 attribute）
            this.allocateLocations(dependencies.attributes);

            // 自动分配 binding（对于 binding 缺省的 uniform 和 sampler）
            this.allocateBindings(dependencies.uniforms, dependencies.samplers);

            // 检查是否有 position builtin（gl_Position）
            const hasPositionBuiltin = globalThis.Array.from(dependencies.builtins).some(b => b.isPosition);
            const hasVaryings = dependencies.varyings.size > 0;
            const needsVaryingStruct = hasPositionBuiltin || hasVaryings;

            // 如果有 varying 或 position builtin，需要生成 VertexOutput
            if (needsVaryingStruct)
            {
                // 为 varying 分配 location
                this.allocateVaryingLocations(dependencies.varyings);

                // 设置 varying 的 toWGSL 方法返回 output.varyingName 格式
                for (const v of dependencies.varyings)
                {
                    if (v.value)
                    {
                        const varyingName = v.name;
                        v.value.toWGSL = () => `output.${varyingName}`;
                    }
                }

                // 设置 position builtin 的结构体前缀
                for (const builtin of dependencies.builtins)
                {
                    if (builtin.isPosition)
                    {
                        builtin.setStructVarPrefix('output');
                    }
                }

                // 生成 VertexOutput 定义
                const structDef = this.generateVertexOutputStructDefinition(dependencies.varyings, dependencies.builtins);
                lines.push(structDef);
            }

            // 收集结构体 uniform 的名称
            const structUniformNames = new Set(dependencies.structUniforms.map(s => s.uniform.name));

            // 收集并生成所有嵌套结构体声明（去重）
            const generatedStructNamesWgsl = new Set<string>();
            for (const structInfo of dependencies.structUniforms)
            {
                const nestedDefs = structInfo.structDef.getNestedStructDefinitions();
                for (const nestedDef of nestedDefs)
                {
                    if (!generatedStructNamesWgsl.has(nestedDef.name))
                    {
                        lines.push(nestedDef.toWGSLStruct());
                        generatedStructNamesWgsl.add(nestedDef.name);
                    }
                }
            }

            // 生成结构体定义
            for (const structInfo of dependencies.structUniforms)
            {
                lines.push(structInfo.structDef.toWGSLStruct());
            }

            // 生成结构体 uniform 声明
            for (const structInfo of dependencies.structUniforms)
            {
                const effectiveBinding = structInfo.uniform.getEffectiveBinding() ?? 0;
                const effectiveGroup = structInfo.uniform.getEffectiveGroup();
                lines.push(structInfo.structDef.toWGSLUniform(structInfo.instanceName, effectiveGroup, effectiveBinding));
            }

            // 生成普通 uniforms（排除结构体 uniform）
            for (const uniform of dependencies.uniforms)
            {
                if (!structUniformNames.has(uniform.name))
                {
                    lines.push(uniform.toWGSL());
                }
            }

            // 生成 samplers（纹理采样器声明）
            for (const sampler of dependencies.samplers)
            {
                lines.push(sampler.toWGSL());
            }

            // 生成外部定义的var_变量（作为全局const）
            const externalVars = dependencies.externalVars;
            for (const { name, expr } of externalVars)
            {
                lines.push(`const ${name}: ${expr.wgslType} = ${expr.toWGSL()};`);
            }

            // 生成着色器函数定义
            for (const shaderFunc of dependencies.shaderFuncs)
            {
                lines.push('');
                lines.push(shaderFunc.toWGSL());
            }

            // 空行
            if (lines.length > 0)
            {
                lines.push('');
            }

            // 生成函数代码
            const funcCode = this.generateVertexFunctionWGSL(dependencies, needsVaryingStruct, hasPositionBuiltin, convertDepth);
            lines.push(...funcCode.split('\n'));

            const resultStr = lines.join('\n') + '\n';

            return resultStr;
        });
    }

    /**
     * 生成顶点着色器函数的 WGSL 代码
     * @param dependencies 分析后的依赖
     * @param needsVaryingStruct 是否需要 VertexOutput
     * @param hasPositionBuiltin 是否有 position builtin
     * @param convertDepth 是否转换深度
     * @returns 函数代码字符串
     */
    private generateVertexFunctionWGSL(
        dependencies: ReturnType<typeof this.getAnalyzedDependencies>,
        needsVaryingStruct: boolean,
        hasPositionBuiltin: boolean,
        convertDepth: boolean,
    ): string
    {
        const lines: string[] = [];

        // 生成函数参数
        const params: string[] = [];
        for (const attr of dependencies.attributes)
        {
            params.push(attr.toWGSL());
        }

        // 添加 builtins 参数（只添加输入类型的 builtin，如 vertex_index）
        for (const builtin of dependencies.builtins)
        {
            if (builtin.isVertexIndex || builtin.isInstanceIndex)
            {
                params.push(builtin.toWGSL());
            }
        }

        // 如果需要 VertexOutput，添加 var output: VertexOutput; 声明和相关语句
        if (needsVaryingStruct)
        {
            // 检查是否已经添加了 var output: VertexOutput; 声明
            const hasVarDeclaration = this.statements.some((stmt) =>
                (stmt as any)._isAutoVarDeclaration,
            );
            if (!hasVarDeclaration)
            {
                // 在函数体开头添加 var output: VertexOutput; 声明
                const varDeclStmt: any = {
                    toGLSL: () => '',
                    toWGSL: () => `var output: VertexOutput;`,
                };
                varDeclStmt._isAutoVarDeclaration = true;

                const newStatements: any[] = [varDeclStmt];
                for (const stmt of this.statements)
                {
                    newStatements.push(stmt);
                }
                this.statements = newStatements;
            }

            // 检查是否有 return_() 语句或已添加的自动 return 语句
            const hasReturnStatement = this.statements.some((stmt) =>
                (stmt as any)._isReturn || (stmt as any)._isAutoReturn,
            );

            // 检查是否已添加深度转换语句
            const hasDepthConvert = this.statements.some((stmt) => (stmt as any)._isAutoDepthConvert);

            // 如果启用了深度转换，且使用的是 gl_Position.assign() 方式（无 return_() 语句）
            // 且尚未添加深度转换语句，则在 return 前添加深度转换语句
            if (convertDepth && hasPositionBuiltin && !hasReturnStatement && !hasDepthConvert)
            {
                const positionBuiltin = globalThis.Array.from(dependencies.builtins).find(b => b.isPosition);
                if (positionBuiltin)
                {
                    const depthConvertStmt: any = {
                        toGLSL: () => '',
                        toWGSL: () =>
                        {
                            const posVarName = positionBuiltin.getFullWGSLVarName();

                            return `${posVarName} = vec4<f32>(${posVarName}.xy, (${posVarName}.z + 1.0) * 0.5, ${posVarName}.w);`;
                        },
                    };
                    depthConvertStmt._isAutoDepthConvert = true;
                    this.statements.push(depthConvertStmt);
                }
            }

            // 如果没有找到 return 语句，添加 return output;
            if (!hasReturnStatement)
            {
                const returnStmt: any = {
                    toGLSL: () => '',
                    toWGSL: () => `return output;`,
                };
                returnStmt._isAutoReturn = true;
                this.statements.push(returnStmt);
            }
        }

        // 生成函数签名
        lines.push('@vertex');
        const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';
        const returnType = needsVaryingStruct ? 'VertexOutput' : '@builtin(position) vec4<f32>';
        lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);

        // 生成函数体语句
        lines.push(...this.generateWGSLStatements());

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * 生成 VertexOutput 定义
     * @param varyings varying 集合
     * @param builtins builtin 集合
     * @returns VertexOutput 定义字符串
     */
    private generateVertexOutputStructDefinition(varyings: Set<Varying>, builtins: Set<Builtin>): string
    {
        const structLines: string[] = ['struct VertexOutput {'];

        // 添加 position builtin
        for (const builtin of builtins)
        {
            if (builtin.isPosition)
            {
                structLines.push('    @builtin(position) position: vec4<f32>,');
                break; // 只添加一个 position
            }
        }

        // 添加所有 varying（使用 toWGSL() 以包含 @interpolate 属性）
        for (const v of varyings)
        {
            if (v.value)
            {
                structLines.push(`    ${v.toWGSL()},`);
            }
        }

        structLines.push('}');

        return structLines.join('\n');
    }

    /**
     * 为 varying 分配 location
     * @param varyings varying 集合
     */
    private allocateVaryingLocations(varyings: Set<Varying>): void
    {
        const usedLocations = new Set<number>();

        // 收集已显式指定的 location
        for (const v of varyings)
        {
            if (v.location !== undefined)
            {
                usedLocations.add(v.location);
            }
        }

        // 为 location 缺省的 varying 自动分配 location
        for (const v of varyings)
        {
            if (v.location === undefined)
            {
                let nextLocation = 0;
                while (usedLocations.has(nextLocation))
                {
                    nextLocation++;
                }
                v.setAutoLocation(nextLocation);
                usedLocations.add(nextLocation);
            }
        }
    }

    /**
     * 自动分配 location 值
     * @param attributes attribute 集合
     */
    protected allocateLocations(attributes: Set<Attribute>): void
    {
        const usedLocations = new Set<number>();

        // 收集已显式指定的 location
        for (const attribute of attributes)
        {
            if (attribute.location !== undefined)
            {
                usedLocations.add(attribute.location);
            }
        }

        // 为 location 缺省的 attribute 自动分配 location
        for (const attribute of attributes)
        {
            if (attribute.location === undefined)
            {
                // 找到下一个未使用的 location
                let nextLocation = 0;
                while (usedLocations.has(nextLocation))
                {
                    nextLocation++;
                }

                // 分配 location
                attribute.setAutoLocation(nextLocation);
                usedLocations.add(nextLocation);
            }
        }
    }

    /**
     * 自动分配 binding 值
     * @param uniforms uniform 集合
     * @param samplers sampler 集合
     */
    private allocateBindings(uniforms: Set<Uniform>, samplers: Set<Sampler>): void
    {
        // 按 group 分组，计算每个 group 下已使用的 binding
        const usedBindingsByGroup = new Map<number, Set<number>>();

        // 获取或创建指定 group 的 usedBindings 集合
        const getUsedBindings = (group: number): Set<number> =>
        {
            if (!usedBindingsByGroup.has(group))
            {
                usedBindingsByGroup.set(group, new Set());
            }

            return usedBindingsByGroup.get(group)!;
        };

        // 收集已显式指定的 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding !== undefined)
            {
                getUsedBindings(uniform.getEffectiveGroup()).add(uniform.binding);
            }
        }

        // 收集已显式指定的 sampler binding（sampler 占用两个 binding：texture 和 sampler）
        for (const sampler of samplers)
        {
            if (sampler.uniform.binding !== undefined)
            {
                const effectiveGroup = sampler.uniform.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);
                usedBindings.add(sampler.uniform.binding);
                usedBindings.add(sampler.uniform.binding + 1);
            }
        }

        // 为 binding 缺省的 uniform 自动分配 binding
        for (const uniform of uniforms)
        {
            if (uniform.binding === undefined)
            {
                const effectiveGroup = uniform.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);

                // 找到下一个未使用的 binding
                let nextBinding = 0;
                while (usedBindings.has(nextBinding))
                {
                    nextBinding++;
                }

                // 分配 binding
                uniform.setAutoBinding(nextBinding);
                usedBindings.add(nextBinding);
            }
        }

        // 为 binding 缺省的 sampler 自动分配 binding（sampler 占用两个 binding）
        for (const sampler of samplers)
        {
            if (sampler.uniform.binding === undefined)
            {
                const effectiveGroup = sampler.uniform.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);

                // 找到下一个未使用的 binding（需要连续两个 binding）
                let nextBinding = 0;
                while (usedBindings.has(nextBinding) || usedBindings.has(nextBinding + 1))
                {
                    nextBinding++;
                }

                // 分配 binding
                sampler.uniform.setAutoBinding(nextBinding);
                usedBindings.add(nextBinding);
                usedBindings.add(nextBinding + 1);
            }
        }
    }
}

/**
 * 定义 Vertex Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Vertex 实例
 */
export function vertex(name: string, body: () => void): Vertex
{
    return new Vertex(name, body);
}
