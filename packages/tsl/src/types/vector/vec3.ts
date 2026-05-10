import { IElement, ShaderValue } from '../../core/IElement';
import { Assign } from '../../variables/assign';
import { formatOperand, wrapForSwizzle } from '../../core/expressionUtils';
import { formatNumber } from '../../core/formatNumber';
import { Float } from '../scalar/float';
import { Vec2 } from './vec2';

/**
 * Vec3 类，用于表示 vec3 字面量值
 * @internal 库外部不应直接使用 `new Vec3()`，应使用 `vec3()` 函数
 */
export class Vec3 implements ShaderValue
{
    readonly glslType = 'vec3';
    readonly wgslType = 'vec3<f32>';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(value: Float | number);
    constructor(x: number, y: number, z: number);
    constructor(x: Float, y: Float, z: Float);
    constructor(vec2: Vec2, z: Float | number);
    constructor(...args: (number | Float | Vec2)[])
    {
        if (args.length === 0) return;
        if (args.length === 1 && (typeof args[0] === 'number' || args[0] instanceof Float))
        {
            const value = args[0] as number | Float;
            if (typeof value === 'number')
            {
                this.toGLSL = () => `vec3(${formatNumber(value)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(value)})`;
                this.dependencies = [];
            }
            else
            {
                this.toGLSL = () => `vec3(${value.toGLSL()})`;
                this.toWGSL = () => `vec3<f32>(${value.toWGSL()})`;
                this.dependencies = [value];
            }
        }
        else if (args.length === 2 && args[0] instanceof Vec2)
        {
            // 从 vec2 和 float/number 构造 vec3
            const vec2 = args[0] as Vec2;
            const z = args[1] as Float | number;
            if (typeof z === 'number')
            {
                this.toGLSL = () => `vec3(${vec2.toGLSL()}, ${formatNumber(z)})`;
                this.toWGSL = () => `vec3<f32>(${vec2.toWGSL()}, ${formatNumber(z)})`;
                this.dependencies = [vec2];
            }
            else
            {
                this.toGLSL = () => `vec3(${vec2.toGLSL()}, ${z.toGLSL()})`;
                this.toWGSL = () => `vec3<f32>(${vec2.toWGSL()}, ${z.toWGSL()})`;
                this.dependencies = [vec2, z];
            }
        }
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;

            // 如果三个参数相同，使用单个参数形式
            if (x === y && y === z)
            {
                this.toGLSL = () => `vec3(${formatNumber(x)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(x)})`;
            }
            else
            {
                this.toGLSL = () => `vec3(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
                this.toWGSL = () => `vec3<f32>(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
            }
            this.dependencies = [];
        }
        else if (args.length === 3 && args[0] instanceof Float && args[1] instanceof Float && args[2] instanceof Float)
        {
            // 从三个 Float 表达式构造 vec3
            const x = args[0] as Float;
            const y = args[1] as Float;
            const z = args[2] as Float;

            this.toGLSL = () => `vec3(${x.toGLSL()}, ${y.toGLSL()}, ${z.toGLSL()})`;
            this.toWGSL = () => `vec3<f32>(${x.toWGSL()}, ${y.toWGSL()}, ${z.toWGSL()})`;
            this.dependencies = [x, y, z];
        }
        else
        {
            throw new Error('Invalid arguments for vec3');
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
     * 乘法运算
     */
    multiply(other: Vec3): Vec3;
    multiply(other: Float): Vec3;
    multiply(other: number): Vec3;
    multiply(other: Vec3 | Float | number): Vec3
    {
        const result = new Vec3();
        if (other instanceof Vec3)
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
                const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toGLSL());

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toWGSL());

                return `${left} * ${right}`;
            };
            result.dependencies = typeof other === 'number' ? [this] : [this, other];
        }

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Vec3): Vec3
    {
        const result = new Vec3();
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
    subtract(other: Vec3): Vec3;
    subtract(other: number): Vec3;
    subtract(other: Vec3 | number): Vec3
    {
        const result = new Vec3();
        if (typeof other === 'number')
        {
            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());

                return `${left} - ${formatNumber(other)}`;
            };
            // WGSL 不支持 vec3 - float，需要转换为 vec3 - vec3(float)
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());

                return `${left} - vec3<f32>(${formatNumber(other)})`;
            };
            result.dependencies = [this];
        }
        else
        {
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
        }

        return result;
    }

    /**
     * 取反运算（返回 -this）
     */
    negate(): Vec3
    {
        const result = new Vec3();
        result.toGLSL = () => `-${wrapForSwizzle(this.toGLSL())}`;
        result.toWGSL = () => `-${wrapForSwizzle(this.toWGSL())}`;
        result.dependencies = [this];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Vec3 | Float | number): Vec3
    {
        const result = new Vec3();
        if (other instanceof Vec3)
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
    assign(value: Vec3): void
    {
        new Assign(this, value);
    }
}

/**
 * vec3 构造函数（默认）
 */
export function vec3(): Vec3;
/**
 * vec3 构造函数（无参数）
 */
export function vec3(): Vec3;
/**
 * vec3 构造函数
 * @param value 单个值填充所有分量（Float 或数字）
 */
export function vec3(value: Float | number): Vec3;
/**
 * vec3 构造函数
 * @param x x 分量（Float 或数字）
 * @param y y 分量（Float 或数字）
 * @param z z 分量（Float 或数字）
 */
export function vec3(x: Float | number, y: Float | number, z: Float | number): Vec3;
/**
 * vec3 构造函数
 * @param vec2 Vec2 的 xy 分量
 * @param z z 分量（Float 或数字）
 */
export function vec3(vec2: Vec2, z: Float | number): Vec3;
export function vec3(...args: (number | Float | Vec2)[]): Vec3
{
    return new (Vec3 as any)(...args);
}
