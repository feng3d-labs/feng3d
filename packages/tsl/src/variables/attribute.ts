import { getBuildParam } from '../core/buildShader';
import { IElement, ShaderValue } from '../core/IElement';
import { Float } from '../types/scalar/float';
import { Vec2 } from '../types/vector/vec2';
import { Vec3 } from '../types/vector/vec3';
import { Vec4 } from '../types/vector/vec4';

/**
 * Attribute 类
 * @internal 库外部不应直接使用 `new Attribute()`，应使用 `attribute()` 函数
 */
export class Attribute implements IElement
{
    dependencies: IElement[];
    readonly name: string;
    value?: ShaderValue;
    readonly location?: number;
    private _autoLocation?: number; // 自动分配的 location

    constructor(name: string, value?: ShaderValue, location?: number)
    {
        this.name = name;
        this.value = value;
        this.location = location;
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
     * 转换为 GLSL 代码
     * @param type 着色器类型
     */
    toGLSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法生成 GLSL。`);
        }
        const glslType = this.value?.glslType;
        const effectiveLocation = this.getEffectiveLocation();
        const buildParam = getBuildParam();
        const version = buildParam?.version ?? 1;

        if (version === 2)
        {
            return `layout(location = ${effectiveLocation}) in ${glslType} ${this.name};`;
        }
        else
        {
            return `attribute ${glslType} ${this.name};`;
        }
    }

    /**
     * 转换为 WGSL 代码（用于函数参数）
     */
    toWGSL(): string
    {
        if (!this.value)
        {
            throw new Error(`Attribute '${this.name}' 没有设置 value，无法生成 WGSL。`);
        }
        const wgslType = this.value?.wgslType;
        const effectiveLocation = this.getEffectiveLocation();
        const location = `@location(${effectiveLocation})`;

        return `${location} ${this.name}: ${wgslType}`;
    }

}

/**
 * 定义 attribute 变量
 *
 * 使用方式：
 * - `const position = attribute('position', vec2())` - 定义 vec2 类型的 attribute
 * - `const position = attribute('position', vec3())` - 定义 vec3 类型的 attribute
 * - `const rotation = attribute('rotation', float())` - 定义 float 类型的 attribute
 * - `const position = attribute('position', vec2(), 0)` - 指定 location
 *
 * @param name attribute 名称
 * @param value 类型模板（用于推断类型）
 * @param location 可选的 location 值
 * @returns 与 value 相同类型的实例，关联到创建的 Attribute
 */
export function attribute<T extends Float | Vec2 | Vec3 | Vec4>(name: string, value: T): T;
export function attribute<T extends Float | Vec2 | Vec3 | Vec4>(name: string, value: T, location: number): T;
export function attribute<T extends Float | Vec2 | Vec3 | Vec4>(name: string, value: T, location?: number): T
{
    // 创建 Attribute 实例
    const attr = new Attribute(name, undefined, location);

    // 创建与 value 相同类型的新实例
    const result = new (value.constructor as new () => T)();

    // 设置双向引用
    result.toGLSL = () => name;
    result.toWGSL = () => name;
    result.dependencies = [attr];
    attr.value = result;

    return result;
}

