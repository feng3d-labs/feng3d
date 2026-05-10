import { buildShader } from '../core/buildShader';
import { Builtin } from '../glsl/builtin/builtin';
import { Varying } from '../variables/varying';
import { Vertex } from './vertex';

/**
 * Transform 类，包装 Vertex 用于 Transform Feedback
 *
 * 专门用于 Transform Feedback 着色器，其 toWGSL 方法生成计算着色器代码。
 */
export class Transform
{
    private vertex: Vertex;

    constructor(name: string, body: () => void)
    {
        this.vertex = new Vertex(name, body);
    }

    /**
     * 获取着色器函数名称
     */
    get name(): string
    {
        return this.vertex.name;
    }

    /**
     * 获取函数体语句
     */
    get statements()
    {
        return this.vertex.statements;
    }

    /**
     * 转换为 GLSL 顶点着色器代码（WebGL2）
     *
     * Transform Feedback 仅支持 WebGL2，因此始终生成 GLSL ES 3.0 代码。
     *
     * @returns 完整的 GLSL 代码
     */
    toGLSL(): string
    {
        return this.vertex.toGLSL(2);
    }

    /**
     * 转换为 WGSL 计算着色器代码（用于 WebGPU 模拟 Transform Feedback）
     *
     * @param options 可选配置
     * @param options.varyings 指定输出的 varying 变量名数组，必须提供
     * @param options.bufferMode 缓冲区模式：'INTERLEAVED_ATTRIBS'（交错）或 'SEPARATE_ATTRIBS'（分离），默认为 'INTERLEAVED_ATTRIBS'
     * @returns 完整的 WGSL 计算着色器代码
     *
     * @example
     * ```typescript
     * // 交错模式
     * const computeWgsl = transformShader.toWGSL({
     *     varyings: ['v_position', 'v_color'],
     * });
     *
     * // 分离模式
     * const computeWgsl = transformShader.toWGSL({
     *     varyings: ['v_position', 'v_velocity', 'v_spawntime', 'v_lifetime'],
     *     bufferMode: 'SEPARATE_ATTRIBS',
     * });
     * ```
     */
    toWGSL(options: { varyings: string[]; bufferMode?: 'INTERLEAVED_ATTRIBS' | 'SEPARATE_ATTRIBS' }): string
    {
        const workgroupSize = 64;
        const specifiedVaryings = options.varyings;
        const bufferMode = options.bufferMode ?? 'INTERLEAVED_ATTRIBS';
        const isSeparate = bufferMode === 'SEPARATE_ATTRIBS';

        return buildShader({ language: 'wgsl', stage: 'compute', version: 1 }, () =>
        {
            const lines: string[] = [];

            // 执行 body 收集依赖
            this.vertex['executeBodyIfNeeded']();

            // 从函数的 dependencies 中分析获取 attributes、uniforms（使用缓存）
            const dependencies = this.vertex.getAnalyzedDependencies();

            // 自动分配 location（对于 location 缺省的 attribute）
            this.vertex['allocateLocations'](dependencies.attributes);

            // 收集需要作为输入的 attributes
            const inputAttributes = globalThis.Array.from(dependencies.attributes);

            // 检查是否需要输出 gl_Position
            const includesGlPosition = specifiedVaryings.includes('gl_Position');
            const varyingNames = specifiedVaryings.filter((name) => name !== 'gl_Position');

            // 从指定的 varyings 名称中筛选出实际的 Varying 对象
            const allVaryings = globalThis.Array.from(dependencies.varyings);
            const outputVaryings: Varying[] = varyingNames.map((name) =>
            {
                const found = allVaryings.find((v) => v.name === name);
                if (!found)
                {
                    throw new Error(`[TSL] Varying '${name}' not found in shader dependencies`);
                }

                return found;
            });

            // 收集自定义函数
            const shaderFuncs = globalThis.Array.from(dependencies.shaderFuncs);

            // 不再生成输入结构体，改为分离的输入缓冲区
            // struct VertexInput 已不需要

            if (!isSeparate)
            {
                // 交错模式：生成单一输出结构体
                lines.push('struct VertexOutput {');
                if (includesGlPosition)
                {
                    lines.push('    gl_Position: vec4<f32>,');
                }
                for (const varying of outputVaryings)
                {
                    const wgslType = varying.value?.wgslType ?? 'vec4<f32>';
                    lines.push(`    ${varying.name}: ${wgslType},`);
                }
                lines.push('}');
                lines.push('');
            }

            // 收集结构体 uniform 的名称
            const structUniformNames = new Set(dependencies.structUniforms.map((s) => s.uniform.name));

            // 自动分配 binding（从 0 开始，为 input 和 output 缓冲区预留位置）
            let nextBinding = 0;

            // 生成 uniforms
            for (const uniform of dependencies.uniforms)
            {
                if (!structUniformNames.has(uniform.name))
                {
                    const effectiveGroup = uniform.getEffectiveGroup();
                    lines.push(`@group(${effectiveGroup}) @binding(${nextBinding}) var<uniform> ${uniform.name}: ${uniform.value?.wgslType ?? 'mat4x4<f32>'};`);
                    nextBinding++;
                }
            }

            // 生成结构体 uniform
            for (const structInfo of dependencies.structUniforms)
            {
                const effectiveGroup = structInfo.uniform.getEffectiveGroup();
                lines.push(structInfo.structDef.toWGSLUniform(structInfo.instanceName, effectiveGroup, nextBinding));
                nextBinding++;
            }

            // 生成分离的输入存储缓冲区（每个属性一个缓冲区）
            for (const attr of inputAttributes)
            {
                const wgslType = attr.value?.wgslType ?? 'vec4<f32>';
                lines.push(`@group(0) @binding(${nextBinding}) var<storage, read> inputData_${attr.name}: array<${wgslType}>;`);
                nextBinding++;
            }

            if (isSeparate)
            {
                // 分离模式：为每个输出生成独立的缓冲区
                if (includesGlPosition)
                {
                    lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData_gl_Position: array<vec4<f32>>;`);
                    nextBinding++;
                }
                for (const varying of outputVaryings)
                {
                    const wgslType = varying.value?.wgslType ?? 'vec4<f32>';
                    lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData_${varying.name}: array<${wgslType}>;`);
                    nextBinding++;
                }
            }
            else
            {
                // 交错模式：生成单一输出缓冲区
                lines.push(`@group(0) @binding(${nextBinding}) var<storage, read_write> outputData: array<VertexOutput>;`);
                nextBinding++;
            }

            lines.push('');

            // 生成自定义函数定义
            for (const shaderFunc of shaderFuncs)
            {
                lines.push(shaderFunc.toWGSL());
                lines.push('');
            }

            // 生成计算着色器入口函数
            lines.push(`@compute @workgroup_size(${workgroupSize})`);
            lines.push(`fn ${this.name}(@builtin(global_invocation_id) global_id: vec3<u32>) {`);
            lines.push('    let idx = global_id.x;');

            if (!isSeparate)
            {
                lines.push('    var output: VertexOutput;');
            }
            lines.push('');

            // 设置 attribute 的 toWGSL 返回分离的输入缓冲区格式
            for (const attr of inputAttributes)
            {
                if (attr.value)
                {
                    const attrName = attr.name;
                    attr.value.toWGSL = () => `inputData_${attrName}[idx]`;
                }
            }

            // 设置 varying 的 toWGSL 返回对应格式
            for (const varying of outputVaryings)
            {
                if (varying.value)
                {
                    const varyingName = varying.name;
                    if (isSeparate)
                    {
                        varying.value.toWGSL = () => `outputData_${varyingName}[idx]`;
                    }
                    else
                    {
                        varying.value.toWGSL = () => `output.${varyingName}`;
                    }
                }
            }

            // 设置 position builtin 的 toWGSL
            const positionBuiltin = globalThis.Array.from(dependencies.builtins).find((b) => b.isPosition);
            if (positionBuiltin && positionBuiltin.value)
            {
                if (includesGlPosition)
                {
                    // 当 gl_Position 被指定为输出时，设置正确的输出格式
                    if (isSeparate)
                    {
                        positionBuiltin.value.toWGSL = () => 'outputData_gl_Position[idx]';
                    }
                    else
                    {
                        positionBuiltin.value.toWGSL = () => 'output.gl_Position';
                    }
                }
                else
                {
                    // 在计算着色器中，gl_Position 赋值会被忽略
                    positionBuiltin.value.toWGSL = () => '/* gl_Position ignored in compute shader */';
                }
            }

            // 生成函数体语句（跳过 precision 等不需要的语句）
            for (const stmt of this.statements)
            {
                const wgsl = stmt.toWGSL();
                // 跳过空语句和 precision 语句
                if (wgsl.trim() === '' || wgsl.includes('precision'))
                {
                    continue;
                }
                // 跳过自动生成的语句
                if ((stmt as any)._isAutoVarDeclaration || (stmt as any)._isAutoReturn || (stmt as any)._isAutoDepthConvert)
                {
                    continue;
                }
                const stmtLines = wgsl.split('\n');
                for (const line of stmtLines)
                {
                    lines.push(`    ${line}`);
                }
            }

            if (!isSeparate)
            {
                // 交错模式：将输出写入单一缓冲区
                lines.push('');
                lines.push('    outputData[idx] = output;');
            }

            lines.push('}');

            return lines.join('\n') + '\n';
        });
    }
}

/**
 * 创建一个 Transform Feedback 着色器
 *
 * @param name 着色器函数名
 * @param body 着色器函数体
 * @returns Transform 对象
 *
 * @example
 * ```typescript
 * const transformShader = transform('main', () => {
 *     gl_Position.assign(MVP.multiply(position));
 *     v_color.assign(vec4(clamp(vec2(position), 0.0, 1.0), 0.0, 1.0));
 * });
 *
 * // 生成 GLSL 顶点着色器（WebGL2）
 * const glsl = transformShader.toGLSL();
 *
 * // 生成 WGSL 计算着色器（WebGPU）
 * const wgsl = transformShader.toWGSL({ varyings: ['v_position', 'v_color'] });
 *
 * // 分离模式
 * const wgslSeparate = transformShader.toWGSL({
 *     varyings: ['v_position', 'v_velocity'],
 *     bufferMode: 'SEPARATE_ATTRIBS',
 * });
 * ```
 */
export function transform(name: string, body: () => void): Transform
{
    return new Transform(name, body);
}
