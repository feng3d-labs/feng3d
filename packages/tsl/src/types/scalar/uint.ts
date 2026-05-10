import { IElement, ShaderValue } from '../../core/IElement';
import { formatOperand } from '../../core/expressionUtils';
import { Bool } from './bool';

/**
 * UInt 类，用于表示无符号整数类型（uint/u32）
 * @internal 库外部不应直接使用 `new UInt()`，应使用 `uint()` 函数
 */
export class UInt implements ShaderValue
{
    readonly glslType = 'uint';
    readonly wgslType = 'u32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    /**
     * 标记此 UInt 是否来自 GLSL 中实际为 int 类型的 builtin（如 gl_VertexID、gl_InstanceID）
     * 用于在生成 GLSL 代码时避免使用 `u` 后缀
     */
    private _isGLSLInt = false;

    constructor();
    constructor(value: number);
    constructor(other: IElement);
    constructor(...args: (number | IElement)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于 var_ 函数创建新实例
            return;
        }
        if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            const uintValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${uintValue}u`;
            this.toWGSL = () => `${uintValue}u`;
            this.dependencies = [];
        }
        else if (args.length === 1 && typeof args[0] === 'object')
        {
            const other = args[0] as IElement;
            this.dependencies = [other];

            // 类型转换，将其他类型转换为uint
            this.toGLSL = () => `uint(${other.toGLSL()})`;
            this.toWGSL = () => `u32(${other.toWGSL()})`;
        }
        else
        {
            throw new Error('Invalid arguments for UInt');
        }
    }

    divide(other: number): UInt
    {
        const result = new UInt();
        const intValue = Math.floor(other);
        // 如果来自 GLSL int 类型的 builtin，不使用 u 后缀
        result.toGLSL = () => `${this.toGLSL()} / ${intValue}${this._isGLSLInt ? '' : 'u'}`;
        result.toWGSL = () => `${this.toWGSL()} / ${intValue}u`;
        result.dependencies = [this];
        result._isGLSLInt = this._isGLSLInt; // 传递标记

        return result;
    }

    /**
     * 取模运算
     */
    mod(other: UInt | number): UInt
    {
        const result = new UInt();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toGLSL());
            // 如果来自 GLSL int 类型的 builtin，不使用 u 后缀
            const right = typeof other === 'number'
                ? `${Math.floor(other)}${this._isGLSLInt ? '' : 'u'}`
                : formatOperand(other, '%', false, () => other.toGLSL());

            return `${left} % ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toWGSL());
            const right = typeof other === 'number'
                ? `${Math.floor(other)}u`
                : formatOperand(other, '%', false, () => other.toWGSL());

            return `${left} % ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];
        result._isGLSLInt = this._isGLSLInt; // 传递标记

        return result;
    }

    /**
     * 等于比较
     */
    equals(other: UInt | number): Bool
    {
        const result = new Bool();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            // 如果来自 GLSL int 类型的 builtin，不使用 u 后缀
            result.toGLSL = () => `(${this.toGLSL()} == ${intValue}${this._isGLSLInt ? '' : 'u'})`;
            result.toWGSL = () => `(${this.toWGSL()} == ${intValue}u)`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `(${this.toGLSL()} == ${other.toGLSL()})`;
            result.toWGSL = () => `(${this.toWGSL()} == ${other.toWGSL()})`;
            result.dependencies = [this, other];
        }

        return result;
    }
}

/**
 * uint 构造函数
 */
export function uint(): UInt;
export function uint(value: number): UInt;
export function uint(other: IElement): UInt;
export function uint(...args: (number | IElement)[]): UInt
{
    return new (UInt as any)(...args);
}
