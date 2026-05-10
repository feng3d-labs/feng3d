import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';
import { Vec4 } from './vec4';

/**
 * Uvec4 类，用于表示 uvec4 字面量值
 * @internal 库外部不应直接使用 `new Uvec4()`，应使用 `uvec4()` 函数
 */
export class Uvec4 implements ShaderValue
{
    readonly glslType = 'uvec4';
    readonly wgslType = 'vec4<u32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(vec4: Vec4);
    constructor(x: number, y: number, z: number, w: number);
    constructor(...args: (number | Vec4)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于内部创建实例
            return;
        }
        if (args.length === 1)
        {
            // 处理 vec4
            if (args[0] instanceof Vec4)
            {
                // 从 vec4 转换为 uvec4
                const vec4 = args[0] as Vec4;

                this.toGLSL = () => `uvec4(${vec4.toGLSL()})`;
                this.toWGSL = () => `vec4<u32>(${vec4.toWGSL()})`;
                this.dependencies = [vec4];
            }
            else
            {
                throw new Error('Uvec4 constructor: invalid argument');
            }
        }
        else if (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number' && typeof args[3] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            const w = args[3] as number;
            this.toGLSL = () => `uvec4(${x}, ${y}, ${z}, ${w})`;
            this.toWGSL = () => `vec4<u32>(${x}, ${y}, ${z}, ${w})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Uvec4 constructor: invalid arguments');
        }
    }

    /**
     * 获取 x 分量
     */
    get x(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.x`;
        float.toWGSL = () => `${this.toWGSL()}.x`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 y 分量
     */
    get y(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.y`;
        float.toWGSL = () => `${this.toWGSL()}.y`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 z 分量
     */
    get z(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.z`;
        float.toWGSL = () => `${this.toWGSL()}.z`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 w 分量
     */
    get w(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${this.toGLSL()}.w`;
        float.toWGSL = () => `${this.toWGSL()}.w`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 整数除法操作
     * @param divisor 除数（无符号整数）
     * @returns 商（uvec4）
     */
    divide(divisor: number): Uvec4
    {
        const result = new Uvec4();
        result.toGLSL = () => `${this.toGLSL()} / ${divisor}u`;
        result.toWGSL = () => `${this.toWGSL()} / ${divisor}u`;
        result.dependencies = [this];

        return result;
    }

    /**
     * 整数乘法操作
     * @param multiplier 乘数（无符号整数）
     * @returns 积（uvec4）
     */
    multiply(multiplier: number): Uvec4
    {
        const result = new Uvec4();
        result.toGLSL = () => `${this.toGLSL()} * ${multiplier}u`;
        result.toWGSL = () => `${this.toWGSL()} * ${multiplier}u`;
        result.dependencies = [this];

        return result;
    }
}

/**
 * uvec4 构造函数
 */
export function uvec4(): Uvec4;
export function uvec4(vec4: Vec4): Uvec4;
export function uvec4(x: number, y: number, z: number, w: number): Uvec4;
export function uvec4(
    xOrVec4?: number | Vec4,
    y?: number,
    z?: number,
    w?: number,
): Uvec4
{
    if (arguments.length === 0) return new Uvec4();
    if (arguments.length === 4)
    {
        return new Uvec4(xOrVec4 as number, y!, z!, w!);
    }

    return new Uvec4(xOrVec4 as Vec4);
}

