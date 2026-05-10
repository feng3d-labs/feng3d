import { buildShader } from '../core/buildShader';
import { Builtin } from '../glsl/builtin/builtin';
import { Func } from './func';
import { ShaderValue } from '../core/IElement';
import { Precision } from '../glsl/precision';
import { Sampler } from '../glsl/sampler/sampler';
import { Sampler2DArray } from '../glsl/sampler/sampler2DArray';
import { Sampler3D } from '../glsl/sampler/sampler3D';
import { Uniform } from '../variables/uniform';
import { USampler2D } from '../glsl/sampler/usampler2D';
import { Varying } from '../variables/varying';
import { Vertex } from './vertex';

/**
 * Fragment 类，继承自 Func
 */
export class Fragment extends Func
{
    constructor(name: string, body: () => any)
    {
        super(name, body);
    }

    /**
     * 转换为完整的 GLSL 代码（fragment shader）
     * @returns 完整的 GLSL 代码，包括 precision、uniforms 和函数定义
     */
    toGLSL(version: 1 | 2 = 1): string
    {
        return buildShader({ language: 'glsl', stage: 'fragment', version: version }, () =>
        {
            const lines: string[] = [];

            // 添加版本声明（WebGL 2.0）
            if (version === 2)
            {
                lines.push('#version 300 es');
                lines.push('');
            }

            // 先执行 body 收集依赖（通过调用父类的 toGLSL 来触发，它会执行 body 并填充 dependencies）
            // 这里只为了收集依赖，不生成完整代码
            super.toGLSL();

            // 从函数的 dependencies 中分析获取 uniforms、precision、varyings 和 samplers（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // Fragment shader 需要 precision 声明
            // 收集已设置的 precision
            const precisionMap = new Map<string, Precision>();
            for (const prec of dependencies.precisions)
            {
                precisionMap.set(prec.type, prec);
            }

            // 生成 float precision（如果没有设置，默认使用 highp）
            const floatPrecision = precisionMap.get('float') || new Precision('highp', 'float');
            lines.push(floatPrecision.toGLSL());

            // WebGL 2.0 需要 int precision（只有在使用了 int 类型时才生成，如果没有设置，默认使用 highp）
            if (version === 2)
            {
                // 检查是否有 int 类型的使用
                // 1. 检查 uniforms 中是否有 int 类型的 uniform
                // 2. 检查 attributes 中是否有 int 类型的 attribute
                // 3. 检查所有依赖中是否有 glslType === 'int' 的 ShaderValue
                let hasIntType = false;

                // 检查 uniforms
                hasIntType = Array.from(dependencies.uniforms).some(u =>
                    u.value && u.value.glslType === 'int',
                );

                // 检查 attributes
                if (!hasIntType)
                {
                    hasIntType = Array.from(dependencies.attributes).some(a =>
                        a.value && a.value.glslType === 'int',
                    );
                }

                // 检查所有依赖中的 ShaderValue（包括字面量）
                if (!hasIntType)
                {
                    const checkForInt = (value: any): boolean =>
                    {
                        if (!value || typeof value !== 'object')
                        {
                            return false;
                        }

                        // 检查是否是 ShaderValue 且有 int 类型
                        if ('glslType' in value && value.glslType === 'int')
                        {
                            return true;
                        }

                        // 递归检查 dependencies
                        if ('dependencies' in value && Array.isArray(value.dependencies))
                        {
                            return value.dependencies.some((dep: any) => checkForInt(dep));
                        }

                        return false;
                    };

                    hasIntType = this.dependencies.some(dep => checkForInt(dep));
                }

                if (hasIntType)
                {
                    const intPrecision = precisionMap.get('int') || new Precision('highp', 'int');
                    lines.push(intPrecision.toGLSL());
                }
            }

            // 检查是否有 sampler2DArray，如果有则需要添加 precision 声明（如果没有设置，默认使用 lowp）
            const hasSampler2DArray = Array.from(dependencies.samplers).some(s =>
                s instanceof Sampler2DArray,
            );
            if (hasSampler2DArray)
            {
                const samplerPrecision = precisionMap.get('sampler2DArray') || new Precision('lowp', 'sampler2DArray');
                lines.push(samplerPrecision.toGLSL());
            }

            // 检查是否有 sampler3D，如果有则需要添加 precision 声明（如果没有设置，默认使用 lowp）
            const hasSampler3D = Array.from(dependencies.samplers).some(s =>
                s instanceof Sampler3D,
            );
            if (hasSampler3D)
            {
                const samplerPrecision = precisionMap.get('sampler3D') || new Precision('lowp', 'sampler3D');
                lines.push(samplerPrecision.toGLSL());
            }

            // 检查是否有 usampler2D，如果有则需要添加 precision 声明（如果没有设置，默认使用 highp）
            const hasUSampler2D = Array.from(dependencies.samplers).some(s =>
                s instanceof USampler2D,
            );
            if (hasUSampler2D)
            {
                const samplerPrecision = precisionMap.get('usampler2D') || new Precision('highp', 'usampler2D');
                lines.push(samplerPrecision.toGLSL());
            }

            // 生成 varying 声明
            for (const varying of dependencies.varyings)
            {
                lines.push(varying.toGLSL());
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

            // 生成 samplers（只包含实际使用的）
            for (const sampler of dependencies.samplers)
            {
                lines.push(sampler.toGLSL());
            }

            // WebGL 2.0 需要声明输出变量
            if (version === 2)
            {
                lines.push('');
                // 检查是否有 fragColor；如果有则生成多个输出声明；否则使用默认的单个输出
                if (dependencies.fragColors.size > 0)
                {
                    // 使用 fragColor 时，生成多个输出声明
                    const sortedFragColors = Array.from(dependencies.fragColors).sort((a, b) => a.location - b.location);
                    for (const fc of sortedFragColors)
                    {
                        lines.push(`layout(location = ${fc.location}) out vec4 ${fc.name};`);
                    }
                }
                else
                {
                    lines.push('layout(location = 0) out vec4 color;');
                }
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
     * 转换为完整的 WGSL 代码（fragment shader）
     * @param vertexShader 可选的顶点着色器，用于避免 binding 冲突
     * @returns 完整的 WGSL 代码，包括 uniforms 和函数定义
     */
    toWGSL(vertexShader?: Vertex): string
    {
        return buildShader({ language: 'wgsl', stage: 'fragment', version: 1 }, () =>
        {

            const lines: string[] = [];

            // 先执行 body 收集依赖（只收集依赖，不生成代码）
            this.executeBodyIfNeeded();

            // 从函数的 dependencies 中分析获取 uniforms 和 structs（使用缓存）
            const dependencies = this.getAnalyzedDependencies();

            // 自动分配 binding（对于 binding 缺省的 uniform），考虑顶点着色器的 binding
            this.allocateBindings(dependencies.uniforms, dependencies.samplers, vertexShader);

            // 如果有 varying，生成 FragmentInput
            const hasVaryings = dependencies.varyings.size > 0;
            if (hasVaryings)
            {
                // 为 varying 分配 location（从 vertexShader 获取已分配的 location）
                this.allocateVaryingLocations(dependencies.varyings, vertexShader);

                // 更新 varying 的 value.toWGSL 方法，使其返回 input.name 格式
                // 必须在生成函数体代码之前更新，否则生成的代码会使用旧的路径
                for (const v of dependencies.varyings)
                {
                    if (v.value)
                    {
                        const varyingName = v.name;
                        v.value.toWGSL = () => `input.${varyingName}`;
                    }
                }

                // 生成 FragmentInput 定义（使用 toWGSL() 以包含 @interpolate 属性）
                const structLines: string[] = ['struct FragmentInput {'];
                for (const v of dependencies.varyings)
                {
                    if (v.value)
                    {
                        structLines.push(`    ${v.toWGSL()},`);
                    }
                }
                structLines.push('}');
                lines.push(structLines.join('\n'));
            }

            // 生成 FragmentOut 结构体定义（如果有 fragColor）
            if (dependencies.fragColors.size > 0)
            {
                // 使用 fragColor 时，生成 FragmentOut 结构体
                const sortedFragColors = Array.from(dependencies.fragColors).sort((a, b) => a.location - b.location);
                const structLines: string[] = ['struct FragmentOut {'];
                for (const fc of sortedFragColors)
                {
                    structLines.push(`    @location(${fc.location}) ${fc.name}: vec4<f32>,`);
                }
                structLines.push('};');
                lines.push(structLines.join('\n'));
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

            // 生成 samplers（只包含实际使用的）
            // 在 WGSL 中，sampler.toWGSL() 返回多行（texture 和 sampler 声明）
            for (const sampler of dependencies.samplers)
            {
                const samplerWgsl = sampler.toWGSL();
                lines.push(...samplerWgsl.split('\n'));
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

            // 添加 @fragment 标记
            lines.push('@fragment');

            // 生成函数参数
            const params: string[] = [];

            // 添加结构体参数（如果有 varying）
            if (hasVaryings)
            {
                params.push(`input: FragmentInput`);
            }

            // 添加 builtins 参数（只添加 fragment shader 输入类型的 builtin，如 gl_FragCoord 和 gl_FrontFacing）
            for (const builtin of dependencies.builtins)
            {
                if (builtin.isFragCoord || builtin.isFrontFacing)
                {
                    params.push(builtin.toWGSL());
                }
            }

            const paramStr = params.length > 0 ? `(\n    ${params.map(p => `${p},`).join('\n    ')}\n)` : '()';

            // 检测是否使用了 gl_FragColor
            const hasFragColorBuiltin = Array.from(dependencies.builtins).some(b => b.isFragColorOutput);

            // 检测是否使用了 fragColor
            const hasFragColors = dependencies.fragColors.size > 0;

            // 检查是否有返回语句（判断是否是空片段着色器，如深度-only 渲染）
            // 使用 gl_FragColor 或 fragColor 时，视为有返回值
            const hasReturn = hasFragColorBuiltin
                || hasFragColors
                || this.statements.some(stmt => stmt.toWGSL().includes('return'));

            // 生成返回类型：检查 fragColors；否则使用单个输出
            // 如果没有返回语句（空片段着色器），不添加返回类型
            let returnType: string | null;
            if (!hasReturn)
            {
                // 空片段着色器，仅写深度，不需要返回类型
                returnType = null;
            }
            else if (hasFragColors)
            {
                // 使用 fragColor 时，需要生成结构体返回类型
                returnType = 'FragmentOut';
            }
            else
            {
                returnType = '@location(0) vec4<f32>';
            }

            if (returnType)
            {
                lines.push(`fn ${this.name}${paramStr} -> ${returnType} {`);
            }
            else
            {
                lines.push(`fn ${this.name}${paramStr} {`);
            }

            // 如果使用了 fragColor，需要生成结构体变量并返回
            if (hasFragColors)
            {
                // 使用 fragColor 时，需要声明结构体变量并返回
                lines.push('    var output: FragmentOut;');

                // 生成函数体
                this.statements.forEach(stmt =>
                {
                    // 将 fragColorX 替换为 output.fragColorX
                    let wgslCode = stmt.toWGSL();
                    const sortedFragColors = Array.from(dependencies.fragColors).sort((a, b) => a.location - b.location);
                    for (const fc of sortedFragColors)
                    {
                        // 使用正则替换，确保只替换独立的变量名
                        wgslCode = wgslCode.replace(new RegExp(`\\b${fc.name}\\b`, 'g'), `output.${fc.name}`);
                    }
                    // 处理多行语句，为每行添加缩进
                    const stmtLines = wgslCode.split('\n');
                    for (const line of stmtLines)
                    {
                        lines.push(`    ${line}`);
                    }
                });

                // 在函数体末尾添加 return output; 语句
                lines.push('    return output;');
            }
            else if (hasFragColorBuiltin)
            {
                // 使用 gl_FragColor 时，需要声明 fragColor 变量并返回
                lines.push('    var fragColor: vec4<f32>;');

                // 生成函数体
                this.statements.forEach(stmt =>
                {
                    const wgsl = stmt.toWGSL();
                    // 处理多行语句，为每行添加缩进
                    const stmtLines = wgsl.split('\n');
                    for (const line of stmtLines)
                    {
                        lines.push(`    ${line}`);
                    }
                });

                // 在函数体末尾添加 return fragColor; 语句
                lines.push('    return fragColor;');
            }
            else
            {
                // 生成函数体（单个输出，不需要结构体）
                this.statements.forEach(stmt =>
                {
                    const wgsl = stmt.toWGSL();
                    // 处理多行语句，为每行添加缩进
                    const stmtLines = wgsl.split('\n');
                    for (const line of stmtLines)
                    {
                        lines.push(`    ${line}`);
                    }
                });
            }

            lines.push('}');

            const resultStr = lines.join('\n') + '\n';

            return resultStr;
        });
    }

    /**
     * 自动分配 binding 值
     * @param uniforms uniform 集合
     * @param samplers sampler 集合
     * @param vertexShader 可选的顶点着色器，用于避免 binding 冲突
     */
    private allocateBindings(uniforms: Set<Uniform>, samplers: Set<Sampler>, vertexShader?: Vertex): void
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

        // 如果提供了顶点着色器，先收集顶点着色器中已使用的 binding
        // 同时建立 uniform 名称到 binding 的映射，以便 fragment shader 中同名的 uniform 使用相同的 binding
        const vertexUniformBindingMap = new Map<string, { binding: number; group: number }>();
        if (vertexShader)
        {
            // 确保顶点着色器的依赖已收集
            vertexShader.toWGSL();
            const vertexDependencies = vertexShader.getAnalyzedDependencies();

            // 收集顶点着色器中的 uniform binding
            for (const uniform of vertexDependencies.uniforms)
            {
                const effectiveBinding = uniform.getEffectiveBinding();
                if (effectiveBinding !== undefined)
                {
                    const effectiveGroup = uniform.getEffectiveGroup();
                    getUsedBindings(effectiveGroup).add(effectiveBinding);
                    // 建立名称到 binding 的映射
                    vertexUniformBindingMap.set(uniform.name, { binding: effectiveBinding, group: effectiveGroup });
                }
            }

            // 收集顶点着色器中的 sampler binding（如果有）
            for (const sampler of vertexDependencies.samplers)
            {
                const effectiveBinding = sampler.uniform.getEffectiveBinding() ?? 0;
                const effectiveGroup = sampler.uniform.getEffectiveGroup();
                const usedBindings = getUsedBindings(effectiveGroup);
                usedBindings.add(effectiveBinding);
                usedBindings.add(effectiveBinding + 1);
            }
        }

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

                // 检查顶点着色器中是否有同名的 uniform，如果有，使用相同的 binding
                const vertexBinding = vertexUniformBindingMap.get(uniform.name);
                if (vertexBinding && vertexBinding.group === effectiveGroup)
                {
                    // 使用顶点着色器中的 binding
                    uniform.setAutoBinding(vertexBinding.binding);
                    usedBindings.add(vertexBinding.binding);
                }
                else
                {
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

    /**
     * 为 varying 分配 location
     * @param varyings varying 集合
     * @param vertexShader 可选的顶点着色器，用于获取已分配的 location
     */
    private allocateVaryingLocations(varyings: Set<Varying>, vertexShader?: Vertex): void
    {
        // 如果传入了 vertexShader，从顶点着色器获取已分配的 location
        if (vertexShader)
        {
            const vertexDeps = vertexShader.getAnalyzedDependencies();
            const vertexVaryingMap = new Map<string, number>();

            // 构建顶点着色器 varying 名称到 location 的映射
            for (const v of vertexDeps.varyings)
            {
                const loc = v.getEffectiveLocation();
                if (loc !== undefined)
                {
                    vertexVaryingMap.set(v.name, loc);
                }
            }

            // 为片段着色器的 varying 设置与顶点着色器相同的 location
            for (const v of varyings)
            {
                if (v.location === undefined)
                {
                    const vertexLoc = vertexVaryingMap.get(v.name);
                    if (vertexLoc !== undefined)
                    {
                        v.setAutoLocation(vertexLoc);
                    }
                }
            }

            return;
        }

        // 如果没有传入 vertexShader，自己分配 location
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
}

/**
 * 定义 Fragment Shader 入口函数
 * @param name 函数名
 * @param body 函数体
 * @returns Fragment 实例
 */
export function fragment(name: string, body: () => any): Fragment
{
    return new Fragment(name, body);
}

