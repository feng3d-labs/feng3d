import { IElement, ShaderValue } from '../../core/IElement';
import { Assign } from '../../variables/assign';
import { Builtin } from '../../glsl/builtin/builtin';
import { Bool } from './bool';
import { UInt } from './uint';

/**
 * Int 类，用于表示整数类型（int/i32）
 * @internal 库外部不应直接使用 `new Int()`，应使用 `int()` 函数
 */
export class Int implements ShaderValue
{
    readonly glslType = 'int';
    readonly wgslType = 'i32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    /**
     * 获取原始 WGSL 表达式（不带类型转换）
     * 用于数组索引等场景，避免不必要的 i32() 转换
     */
    toRawWGSL?: () => string;

    constructor();
    constructor(value: number);
    constructor(other: UInt);
    constructor(other: Int);
    constructor(...args: (number | UInt | Int)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于 var_ 函数创建新实例
            return;
        }
        if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            const intValue = Math.floor(value); // 确保是整数
            this.toGLSL = () => `${intValue}`;
            this.toWGSL = () => `${intValue}`;
            this.dependencies = [];
        }
        else if (args.length === 1 && args[0] instanceof Int)
        {
            // Int 到 Int：直接复制引用（不需要类型转换）
            const other = args[0] as Int;
            this.toGLSL = () => other.toGLSL();
            this.toWGSL = () => other.toWGSL();
            this.dependencies = other.dependencies ? [...other.dependencies] : [];
        }
        else if (args.length === 1 && args[0] instanceof UInt)
        {
            // 从 UInt 转换为 Int
            const other = args[0] as UInt;
            this.dependencies = [other];

            // 检查是否来自 gl_InstanceID builtin（在 GLSL 中本身就是 int 类型）
            const isFromInstanceIDBuiltin = other.dependencies?.some(
                (dep) => dep instanceof Builtin && dep.isInstanceIndex,
            );

            if (isFromInstanceIDBuiltin)
            {
                // gl_InstanceID 在 GLSL 中本身就是 int，不需要转换
                const builtin = other.dependencies.find((dep) => dep instanceof Builtin) as Builtin;
                this.toGLSL = () => builtin.toGLSL();
                this.toWGSL = () => `i32(${other.toWGSL()})`;
            }
            else
            {
                this.toGLSL = () => `int(${other.toGLSL()})`;
                this.toWGSL = () => `i32(${other.toWGSL()})`;
            }
        }
        else
        {
            throw new Error('Invalid arguments for Int');
        }
    }

    /**
     * 赋值操作
     * @param value 要赋值的表达式
     */
    assign(value: Int | number): void
    {
        if (typeof value === 'number')
        {
            const intVal = new Int(value);
            new Assign(this, intVal);
        }
        else
        {
            new Assign(this, value);
        }
    }

    /**
     * 等于比较
     */
    equals(other: Int | number): Bool
    {
        const result = new Bool();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            result.toGLSL = () => `(${this.toGLSL()} == ${intValue})`;
            result.toWGSL = () => `(${this.toWGSL()} == ${intValue})`;
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

    /**
     * 取模运算
     */
    mod(other: Int | number): Int
    {
        const result = new Int();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            result.toGLSL = () => `${this.toGLSL()} % ${intValue}`;
            result.toWGSL = () => `${this.toWGSL()} % ${intValue}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} % ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} % ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Int | number): Int
    {
        const result = new Int();
        if (typeof other === 'number')
        {
            const intValue = Math.floor(other);
            result.toGLSL = () => `${this.toGLSL()} / ${intValue}`;
            result.toWGSL = () => `${this.toWGSL()} / ${intValue}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} / ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} / ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }
}

/**
 * int 构造函数
 */
export function int(): Int;
export function int(value: number): Int;
export function int(other: UInt): Int;
export function int(other: Int): Int;
export function int(...args: (number | UInt | Int)[]): Int
{
    return new (Int as any)(...args);
}

