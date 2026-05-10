import { IElement, ShaderValue } from '../../core/IElement';
import { Assign } from '../../variables/assign';
import { FragColor } from '../../glsl/fragColor';
import { formatOperand, wrapForSwizzle } from '../../core/expressionUtils';
import { formatNumber } from '../../core/formatNumber';
import { Float } from '../scalar/float';
import { Uvec4 } from './uvec4';
import { Vec2 } from './vec2';
import { Vec3 } from './vec3';

/**
 * Vec4 类型，表示 vec4 字面量值
 * @internal 库外部不应直接使用 `new Vec4()`，应使用 `vec4()` 函数
 */
export class Vec4 implements ShaderValue
{
    readonly glslType = 'vec4';
    readonly wgslType = 'vec4<f32>';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(color: FragColor);
    constructor(vec4: Vec4);
    constructor(uvec4: Uvec4);
    constructor(xy: Vec2, z: number, w: number);
    constructor(xy: Vec2, zw: Vec2);
    constructor(xyz: Vec3, w: number | Float);
    constructor(x: number | Float, y: number | Float, z: number | Float, w: number | Float);
    constructor(...args: (number | FragColor | Vec2 | Vec3 | Float | Vec4 | Uvec4)[])
    {
        if (args.length === 0) return;
        if (args.length === 1)
        {
            if (args[0] instanceof FragColor)
            {
                const color = args[0] as FragColor;

                // FragColor 的 toGLSL 和 toWGSL 使用 fragColor 定义的名称
                this.toGLSL = () => color.toGLSL();
                this.toWGSL = () => color.toWGSL();
                this.dependencies = [color];
            }
            else if (args[0] instanceof Vec4)
            {
                // 处理 vec4(vec4) 的情况，直接返回自身
                const vec4 = args[0] as Vec4;
                this.toGLSL = vec4.toGLSL;
                this.toWGSL = vec4.toWGSL;
                this.dependencies = vec4.dependencies;
            }
            else if (args[0] instanceof Uvec4)
            {
                // 从 uvec4 转换为 vec4
                const uvec4 = args[0] as Uvec4;
                this.toGLSL = () => `vec4(${uvec4.toGLSL()})`;
                this.toWGSL = () => `vec4<f32>(${uvec4.toWGSL()})`;
                this.dependencies = [uvec4];
            }
            else if (typeof args[0] === 'number' || args[0] instanceof Float)
            {
                // 处理 vec4(value: number | Float) 的情况
                const value = args[0] as number | Float;
                if (typeof value === 'number')
                {
                    this.toGLSL = () => `vec4(${formatNumber(value)})`;
                    this.toWGSL = () => `vec4<f32>(${formatNumber(value)})`;
                    this.dependencies = [];
                }
                else
                {
                    this.toGLSL = () => `vec4(${value.toGLSL()})`;
                    this.toWGSL = () => `vec4<f32>(${value.toWGSL()})`;
                    this.dependencies = [value];
                }
            }
            else
            {
                throw new Error('Vec4 constructor: invalid argument');
            }
        }
        else if (args.length === 3 && args[0] instanceof Vec2 && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            // 处理 vec4(xy: Vec2, z: number, w: number) 的情况
            const xy = args[0] as Vec2;
            const z = args[1] as number;
            const w = args[2] as number;

            this.toGLSL = () => `vec4(${xy.toGLSL()}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.toWGSL = () => `vec4<f32>(${xy.toWGSL()}, ${formatNumber(z)}, ${formatNumber(w)})`;
            this.dependencies = [xy];
        }
        else if (args.length === 2 && args[0] instanceof Vec2 && args[1] instanceof Vec2)
        {
            // 处理 vec4(xy: Vec2, zw: Vec2) 的情况
            const xy = args[0] as Vec2;
            const zw = args[1] as Vec2;

            this.toGLSL = () => `vec4(${xy.toGLSL()}, ${zw.toGLSL()})`;
            this.toWGSL = () => `vec4<f32>(${xy.toWGSL()}, ${zw.toWGSL()})`;
            this.dependencies = [xy, zw];
        }
        else if (args.length === 2 && (args[0] instanceof Vec3 || (args[0] && (args[0] as any).glslType === 'vec3')) && (typeof args[1] === 'number' || args[1] instanceof Float))
        {
            // 处理 vec4(xyz: Vec3 | ShaderValue<vec3>, w: number | Float) 的情况
            const xyz = args[0] as Vec3;
            const w = args[1] as number | Float;

            if (typeof w === 'number')
            {
                this.toGLSL = () => `vec4(${xyz.toGLSL()}, ${formatNumber(w)})`;
                this.toWGSL = () => `vec4<f32>(${xyz.toWGSL()}, ${formatNumber(w)})`;
                this.dependencies = [xyz];
            }
            else
            {
                this.toGLSL = () => `vec4(${xyz.toGLSL()}, ${w.toGLSL()})`;
                this.toWGSL = () => `vec4<f32>(${xyz.toWGSL()}, ${w.toWGSL()})`;
                this.dependencies = [xyz, w];
            }
        }
        else if (args.length === 4)
        {
            // 处理 vec4(x: number | Float, y: number | Float, z: number | Float, w: number | Float) 的情况
            const x = args[0] as number | Float;
            const y = args[1] as number | Float;
            const z = args[2] as number | Float;
            const w = args[3] as number | Float;

            // 如果四个参数都是 number 且相同，使用单个参数形式
            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && typeof w === 'number' && x === y && y === z && z === w)
            {
                this.toGLSL = () => `vec4(${formatNumber(x)})`;
                this.toWGSL = () => `vec4<f32>(${formatNumber(x)})`;
                this.dependencies = [];
            }
            else
            {
                this.toGLSL = () => `vec4(${typeof x === 'number' ? formatNumber(x) : x.toGLSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toGLSL()}, ${typeof z === 'number' ? formatNumber(z) : z.toGLSL()}, ${typeof w === 'number' ? formatNumber(w) : w.toGLSL()})`;
                this.toWGSL = () => `vec4<f32>(${typeof x === 'number' ? formatNumber(x) : x.toWGSL()}, ${typeof y === 'number' ? formatNumber(y) : y.toWGSL()}, ${typeof z === 'number' ? formatNumber(z) : z.toWGSL()}, ${typeof w === 'number' ? formatNumber(w) : w.toWGSL()})`;
                this.dependencies = [x, y, z, w].filter((arg): arg is Float => arg instanceof Float);
            }
        }
        else
        {
            throw new Error('Vec4 constructor: invalid arguments');
        }
    }

    /**
     * 获取 x 分量
     */
    get x(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.x`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.x`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 y 分量
     */
    get y(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.y`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.y`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 z 分量
     */
    get z(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.z`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.z`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 w 分量
     */
    get w(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.w`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.w`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 xy 分量（返回 Vec2）
     */
    get xy(): Vec2
    {
        const vec2 = new (Vec2 as any)();
        vec2.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.xy`;
        vec2.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.xy`;
        vec2.dependencies = [this];

        return vec2;
    }

    /**
     * 获取 zw 分量（返回 Vec2）
     */
    get zw(): Vec2
    {
        const vec2 = new (Vec2 as any)();
        vec2.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.zw`;
        vec2.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.zw`;
        vec2.dependencies = [this];

        return vec2;
    }

    /**
     * 获取 xyz 分量（返回 Vec3）
     */
    get xyz(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.xyz`;
        vec3.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.xyz`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 r 分量（返回 Float，等同于 x）
     */
    get r(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.r`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.r`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 g 分量（返回 Float，等同于 y）
     */
    get g(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.g`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.g`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 b 分量（返回 Float，等同于 z）
     */
    get b(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.b`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.b`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 获取 rgb 分量（返回 Vec3）
     */
    get rgb(): Vec3
    {
        const vec3 = new Vec3();
        vec3.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.rgb`;
        vec3.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.rgb`;
        vec3.dependencies = [this];

        return vec3;
    }

    /**
     * 获取 alpha 分量（返回 Float）
     */
    get a(): Float
    {
        const float = new Float();
        float.toGLSL = () => `${wrapForSwizzle(this.toGLSL())}.a`;
        float.toWGSL = () => `${wrapForSwizzle(this.toWGSL())}.a`;
        float.dependencies = [this];

        return float;
    }

    /**
     * 乘法运算
     */
    multiply(other: Vec4 | Float | number): Vec4
    {
        const result = new Vec4();
        if (other instanceof Vec4)
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = typeof other === 'number' ? other.toString() : formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Vec4): Vec4
    {
        const result = new Vec4();
        result.toGLSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toGLSL());
            const right = formatOperand(other, '+', false, () => other.toGLSL());

            return `${left} + ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toWGSL());
            const right = formatOperand(other, '+', false, () => other.toWGSL());

            return `${left} + ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     */
    subtract(other: Vec4): Vec4
    {
        const result = new Vec4();
        result.toGLSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toGLSL());
            const right = formatOperand(other, '-', false, () => other.toGLSL());

            return `${left} - ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toWGSL());
            const right = formatOperand(other, '-', false, () => other.toWGSL());

            return `${left} - ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Vec4 | Vec3 | Float | number): Vec4
    {
        const result = new Vec4();
        if (other instanceof Vec4 || other instanceof Vec3)
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = [this, other];
        }
        else
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toGLSL());
                const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toGLSL());

                return `${left} / ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '/', true, () => this.toWGSL());
                const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toWGSL());

                return `${left} / ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 赋值操作（用于对内置变量进行赋值）
     * @param value 要赋值的表达式
     */
    assign(value: Vec4): void
    {
        new Assign(this, value);
    }

}

/**
 * vec4 构造函数（无参数）
 */
export function vec4(): Vec4;
/**
 * vec4 构造函数
 * @param color FragColor 颜色输出
 */
export function vec4(color: FragColor): Vec4;
/**
 * vec4 构造函数
 * @param value 单个值填充所有分量（Float 或数字）
 */
export function vec4(value: Float | number): Vec4;
/**
 * vec4 构造函数
 * @param uvec4 Uvec4 转换
 */
export function vec4(uvec4: Uvec4): Vec4;
/**
 * vec4 构造函数
 * @param xy Vec2 的 xy 分量
 * @param z z 分量（Float 或数字）
 * @param w w 分量（Float 或数字）
 */
export function vec4(xy: Vec2, z: Float | number, w: Float | number): Vec4;
/**
 * vec4 构造函数
 * @param xy Vec2 的 xy 分量
 * @param zw Vec2 的 zw 分量
 */
export function vec4(xy: Vec2, zw: Vec2): Vec4;
/**
 * vec4 构造函数
 * @param xyz Vec3 的 xyz 分量
 * @param w w 分量（Float 或数字）
 */
export function vec4(xyz: Vec3, w: Float | number): Vec4;
/**
 * vec4 构造函数
 * @param x x 分量（Float 或数字）
 * @param y y 分量（Float 或数字）
 * @param z z 分量（Float 或数字）
 * @param w w 分量（Float 或数字）
 */
export function vec4(x: Float | number, y: Float | number, z: Float | number, w: Float | number): Vec4;
export function vec4(...args: any[]): Vec4
{
    return new (Vec4 as any)(...args);
}
