import { IElement, ShaderValue } from '../../core/IElement';

/**
 * Bool 类，用于表示 bool 类型
 * @internal 库外部不应直接使用 `new Bool()`，应使用 `bool()` 函数
 */
export class Bool implements ShaderValue
{
    readonly glslType = 'bool';
    readonly wgslType = 'bool';
    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(value: boolean);
    constructor(...args: boolean[])
    {
        if (args.length === 0) return;
        if (args.length === 1 && typeof args[0] === 'boolean')
        {
            const value = args[0] as boolean;
            this.dependencies = [];
            this.toGLSL = () => value.toString();
            this.toWGSL = () => value.toString();
        }
        else
        {
            throw new Error('Invalid arguments for Bool');
        }
    }

    equals(other: Bool | boolean): Bool
    {
        const result = new Bool();
        const otherIsBool = other instanceof Bool;

        result.toGLSL = () => {
            const thisStr = this.toGLSL();
            const otherStr = otherIsBool ? other.toGLSL() : typeof other === 'boolean' ? other.toString() : other;

            return `${thisStr} == ${otherStr}`;
        };

        result.toWGSL = () => {
            const thisStr = this.toWGSL();
            const otherStr = otherIsBool ? other.toWGSL() : typeof other === 'boolean' ? other.toString() : other;

            return `${thisStr} == ${otherStr}`;
        };

        result.dependencies = otherIsBool ? [this, other] : [this];

        return result;
    }

    /**
     * 逻辑 OR 运算
     * @param other 另一个布尔值或布尔表达式
     * @returns 逻辑 OR 的结果
     */
    or(other: Bool): Bool
    {
        const result = new Bool();

        result.toGLSL = () =>
        {
            const thisStr = this.toGLSL();
            const otherStr = other.toGLSL();

            return `(${thisStr}) || (${otherStr})`;
        };

        result.toWGSL = () =>
        {
            const thisStr = this.toWGSL();
            const otherStr = other.toWGSL();

            return `(${thisStr}) || (${otherStr})`;
        };

        result.dependencies = [this, other];

        return result;
    }

    /**
     * 逻辑 AND 运算
     * @param other 另一个布尔值或布尔表达式
     * @returns 逻辑 AND 的结果
     */
    and(other: Bool): Bool
    {
        const result = new Bool();

        result.toGLSL = () =>
        {
            const thisStr = this.toGLSL();
            const otherStr = other.toGLSL();

            return `(${thisStr}) && (${otherStr})`;
        };

        result.toWGSL = () =>
        {
            const thisStr = this.toWGSL();
            const otherStr = other.toWGSL();

            return `(${thisStr}) && (${otherStr})`;
        };

        result.dependencies = [this, other];

        return result;
    }
}

/**
 * bool 构造函数
 */
export function bool(): Bool;
export function bool(value: boolean): Bool;
export function bool(arg?: boolean): Bool
{
    if (arg === undefined)
    {
        return new Bool();
    }

    return new Bool(arg);
}
