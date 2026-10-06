import { buildShader } from '../core/buildShader';
import { buildOverrideLines, Overrides } from './overrides';
import { Func } from './func';
import { Vertex } from './vertex';

/**
 * compute 着色器的 workgroup 尺寸。
 *
 * 对应 WGSL 的 `@workgroup_size(x)` / `@workgroup_size(x, y)` / `@workgroup_size(x, y, z)`。
 * 只给一维时等价于 `@workgroup_size(x, 1, 1)`（WGSL 允许省略后两维，这里省掉以贴近手写）。
 */
export type WorkgroupSizeComponent = number | string;
export type WorkgroupSize = [WorkgroupSizeComponent] | [WorkgroupSizeComponent, WorkgroupSizeComponent] | [WorkgroupSizeComponent, WorkgroupSizeComponent, WorkgroupSizeComponent];

/** compute 入口的额外选项 */
export interface ComputeOptions
{
    /**
     * `override` 声明（名 → 默认值）。
     *
     * 生成 `override <name> = <value>;`，可由 WebGPU 的 pipeline `constants` 在运行期替换。
     * 需要在 {@link WorkgroupSize} 里用变量名的场景（如 `@workgroup_size(blockSize, blockSize)`）就靠它。
     */
    overrides?: Overrides;
}

/**
 * Compute 类：compute 着色器入口（继承 Func，与 Vertex / Fragment 并列）。
 *
 * 与它们的区别：
 * - 没有 varying / 输出结构体；
 * - 用 `@compute @workgroup_size(...)` 声明；
 * - 唯一的内置输入是 `@builtin(global_invocation_id)`（如果需要）。
 *
 * 依赖里的 storage buffer（见 `variables/storageBuffer.ts`）会作为声明输出。
 */
export class Compute extends Func
{
    /** workgroup 尺寸 */
    readonly workgroupSize: WorkgroupSize;

    /** 入口选项 */
    readonly options: ComputeOptions;

    constructor(name: string, workgroupSize: WorkgroupSize, body: () => void, options: ComputeOptions = {})
    {
        super(name, body);
        this.workgroupSize = workgroupSize;
        this.options = options;
    }

    /**
     * 转换为完整的 WGSL compute 着色器代码
     *
     * @returns 完整的 WGSL 代码
     */
    toWGSL(): string
    {
        return buildShader({ language: 'wgsl', stage: 'compute', version: 1 }, () =>
        {
            const lines: string[] = [];

            // override 声明（与 vertex / compute 共用同一份生成逻辑）
            lines.push(...buildOverrideLines(this.options.overrides));

            // 执行 body 收集依赖
            this.executeBodyIfNeeded();

            const dependencies = this.getAnalyzedDependencies();

            // 结构体定义（storage buffer 的元素类型可能是结构体）
            const generatedStructNames = new Set<string>();
            for (const structInfo of dependencies.structUniforms)
            {
                for (const nestedDef of structInfo.structDef.getNestedStructDefinitions())
                {
                    if (!generatedStructNames.has(nestedDef.name))
                    {
                        lines.push(nestedDef.toWGSLStruct());
                        generatedStructNames.add(nestedDef.name);
                    }
                }
                if (!generatedStructNames.has(structInfo.structDef.name))
                {
                    lines.push(structInfo.structDef.toWGSLStruct());
                    generatedStructNames.add(structInfo.structDef.name);
                }
            }

            // storage buffer 的元素结构体定义（如 array<Particle> 里的 Particle）
            const generatedStorageStructs = new Set<string>();
            for (const storageBuffer of dependencies.storageBuffers)
            {
                const structDef = storageBuffer.elementStructDef;
                if (!structDef) continue;
                for (const nested of structDef.getNestedStructDefinitions())
                {
                    if (!generatedStorageStructs.has(nested.name))
                    {
                        lines.push(nested.toWGSLStruct());
                        generatedStorageStructs.add(nested.name);
                    }
                }
                if (!generatedStorageStructs.has(structDef.name))
                {
                    lines.push(structDef.toWGSLStruct());
                    generatedStorageStructs.add(structDef.name);
                }
            }

            // 纹理 / 采样器声明（fragment 早有这段，compute 原先漏了——
            // 存储纹理 texture_storage_2d 也因此不会被声明。与 round 45 的 elementStructDef 同类问题）
            for (const sampler of dependencies.samplers)
            {
                lines.push(sampler.toWGSL());
            }

            // storage buffer 声明
            for (const storageBuffer of dependencies.storageBuffers)
            {
                lines.push(storageBuffer.toWGSL());
            }

            // uniform 声明
            for (const uniform of dependencies.uniforms)
            {
                lines.push(uniform.toWGSL());
            }

            // 辅助函数（依赖里的 ShaderFunc）
            for (const shaderFunc of dependencies.shaderFuncs)
            {
                lines.push(shaderFunc.toWGSL());
            }

            // 入口：@compute @workgroup_size(...) fn name(@builtin(...) ...)
            const size = this.workgroupSize.join(', ');
            const params: string[] = [];
            // **通用**：按依赖里实际用到的 builtin 逐个生成参数
            // （原先硬编码只生成 global_invocation_id，于是 local_invocation_id / workgroup_id 拿不到入口参数）
            for (const builtin of dependencies.builtins)
            {
                if (builtin.value)
                {
                    params.push(`@builtin(${builtin.wgslBuiltinName}) ${builtin.defaultName}: ${builtin.value.wgslType}`);
                }
            }

            lines.push(`@compute @workgroup_size(${size})`);
            lines.push(`fn ${this.name}(${params.join(', ')}) {`);

            // 函数体：用 Func 的语句生成器（**不要**用 super.toWGSL()——它会连函数头一起生成，
            // 于是这里会套出"fn main 里再套一个 fn main"）
            lines.push(...this.generateWGSLStatements());
            lines.push('}');

            return lines.join('\n');
        });
    }
}

/**
 * 定义 compute 着色器入口。
 *
 * @example
 * ```ts
 * const size = storageBuffer('size', { elementType: uint, group: 0, binding: 0 });
 * const grid = uvec3(builtin('global_invocation_id'));
 * const shader = compute('main', [8, 8], () => {
 *     const idx = let_('idx', size.index(0));
 *     // ...
 * });
 * shader.toWGSL();
 * ```
 *
 * @param name 入口函数名（通常是 'main'）
 * @param workgroupSize workgroup 尺寸
 * @param body 函数体
 * @param options 额外选项（override 声明等）
 * @returns Compute 实例
 */
export function compute(name: string, workgroupSize: WorkgroupSize, body: () => void, options?: ComputeOptions): Compute
{
    return new Compute(name, workgroupSize, body, options);
}

/** 供其它模块引用的类型（避免未使用告警） */
export type { Vertex };
