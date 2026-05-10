import { getBuildParam } from '../core/buildShader';
import { IElement, ShaderValue } from '../core/IElement';
import { Float } from '../types/scalar/float';
import { Int } from '../types/scalar/int';
import { Vec2 } from '../types/vector/vec2';
import { Vec3 } from '../types/vector/vec3';
import { Vec4 } from '../types/vector/vec4';

/**
 * 插值类型
 * - 'perspective': 透视校正插值（默认）
 * - 'linear': 线性插值（无透视校正）
 * - 'flat': 平面插值（不插值，使用第一个顶点的值）
 */
export type InterpolationType = 'perspective' | 'linear' | 'flat';

/**
 * 插值采样方式
 * - 'center': 在像素中心采样（默认）
 * - 'centroid': 在图元覆盖区域的质心采样，避免边缘外推
 * - 'sample': 每个采样点独立采样
 */
export type InterpolationSampling = 'center' | 'centroid' | 'sample';

/**
 * Varying 选项
 */
export interface VaryingOptions
{
    /** WGSL location（可选，不指定则自动分配） */
    location?: number;
    /** 插值类型（默认 'perspective'） */
    interpolation?: InterpolationType;
    /** 插值采样方式（默认 'center'） */
    sampling?: InterpolationSampling;
}

/**
 * Varying 类，表示在 vertex 和 fragment shader 之间传递的变量
 *
 * 使用方式：`const v_uv = varying('v_uv', vec2())`
 *
 * 使用 centroid 插值：`const v_attr = varying('v_attr', float(), { sampling: 'centroid' })`
 *
 * @internal 库外部不应直接使用 `new Varying()`，应使用 `varying()` 函数
 */
export class Varying implements IElement
{
    dependencies: IElement[] = [];

    /** 变量名称 */
    name: string;

    /** 值类型（由 vec2/vec3/vec4 等函数设置） */
    value?: ShaderValue;

    /** 显式指定的 location */
    readonly location?: number;

    /** 插值类型 */
    readonly interpolation: InterpolationType;

    /** 插值采样方式 */
    readonly sampling: InterpolationSampling;

    /** 自动分配的 location */
    private _autoLocation?: number;

    constructor(name: string, options?: VaryingOptions | number)
    {
        this.name = name;
        // 兼容旧 API：如果第二个参数是数字，视为 location
        if (typeof options === 'number')
        {
            this.location = options;
            this.interpolation = 'perspective';
            this.sampling = 'center';
        }
        else
        {
            this.location = options?.location;
            this.interpolation = options?.interpolation ?? 'perspective';
            this.sampling = options?.sampling ?? 'center';
        }
    }

    /**
     * 设置自动分配的 location（内部使用）
     */
    setAutoLocation(location: number): void
    {
        this._autoLocation = location;
    }

    /**
     * 获取实际使用的 location（优先使用显式指定的，否则使用自动分配的）
     */
    getEffectiveLocation(): number
    {
        return this.location !== undefined ? this.location : (this._autoLocation ?? 0);
    }

    /**
     * 获取 GLSL 插值限定符
     */
    private getGLSLInterpolationQualifier(): string
    {
        const qualifiers: string[] = [];

        // flat 插值
        if (this.interpolation === 'flat')
        {
            qualifiers.push('flat');
        }
        // noperspective（线性插值）
        else if (this.interpolation === 'linear')
        {
            qualifiers.push('noperspective');
        }
        // perspective 是默认的，不需要限定符

        // centroid 采样
        if (this.sampling === 'centroid')
        {
            qualifiers.push('centroid');
        }
        // sample 采样
        else if (this.sampling === 'sample')
        {
            qualifiers.push('sample');
        }
        // center 是默认的，不需要限定符

        return qualifiers.length > 0 ? qualifiers.join(' ') + ' ' : '';
    }

    /**
     * 转换为 GLSL 代码（用于声明）
     */
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value.glslType;
        const buildParam = getBuildParam();
        const version = buildParam.version ?? 1;
        const stage = buildParam.stage;

        if (version === 2)
        {
            // WebGL 2.0 中，varyings（顶点到片段的变量）不需要 layout(location)
            // 只需要使用 out（vertex shader）或 in（fragment shader）
            const inOut = stage === 'vertex' ? 'out' : 'in';
            const interpolation = this.getGLSLInterpolationQualifier();

            return `${interpolation}${inOut} ${glslType} ${this.name};`;
        }
        else
        {
            // WebGL 1.0 不支持插值限定符
            return `varying ${glslType} ${this.name};`;
        }
    }

    /**
     * 获取 WGSL @interpolate 属性
     */
    private getWGSLInterpolateAttribute(): string
    {
        // flat 插值不需要 sampling
        if (this.interpolation === 'flat')
        {
            return '@interpolate(flat)';
        }

        // 如果使用默认设置，不需要 @interpolate 属性
        if (this.interpolation === 'perspective' && this.sampling === 'center')
        {
            return '';
        }

        // 构建 @interpolate 属性
        return `@interpolate(${this.interpolation}, ${this.sampling})`;
    }

    /**
     * 转换为 WGSL 代码（用于结构体字段定义）
     */
    toWGSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Varying '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value.wgslType;
        const effectiveLocation = this.getEffectiveLocation();
        const location = `@location(${effectiveLocation})`;
        const interpolate = this.getWGSLInterpolateAttribute();

        if (interpolate)
        {
            return `${location} ${interpolate} ${this.name}: ${wgslType}`;
        }

        return `${location} ${this.name}: ${wgslType}`;
    }

    /**
     * 获取变量名（用于在着色器代码中引用）
     */
    getVarName(): string
    {
        return this.name;
    }
}

/**
 * 支持的 varying 类型
 */
type VaryingType = Float | Int | Vec2 | Vec3 | Vec4;

/**
 * 定义 varying 变量
 *
 * 使用方式：
 * - `const v_uv = varying('v_uv', vec2())` - 定义 vec2 类型的 varying
 * - `const v_color = varying('v_color', vec4())` - 定义 vec4 类型的 varying
 * - `const v_uv = varying('v_uv', vec2(), { location: 0 })` - 指定选项
 * - `const v_attr = varying('v_attr', float(), { sampling: 'centroid' })` - 使用 centroid 插值
 * - `const v_id = varying('v_id', int(), { interpolation: 'flat' })` - 使用 flat 插值
 *
 * @param name varying 名称
 * @param value 类型模板（用于推断类型）
 * @param options 可选的 VaryingOptions
 * @returns 与 value 相同类型的实例，关联到创建的 Varying
 */
export function varying<T extends VaryingType>(name: string, value: T, options?: VaryingOptions): T
{
    // 创建 Varying 实例
    const vary = new Varying(name, options);

    // 创建与 value 相同类型的新实例
    const result = new (value.constructor as new () => T)();

    // 设置双向引用
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [vary];
    vary.value = result;

    return result;
}

