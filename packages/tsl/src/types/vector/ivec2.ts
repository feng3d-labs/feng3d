import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';
import { Vec2 } from './vec2';

/**
 * IVec2 类，用于表示 ivec2 字面量值
 * @internal 库外部不应直接使用 `new IVec2()`，应使用 `ivec2()` 函数
 */
export class IVec2 implements ShaderValue
{
    readonly glslType = 'ivec2';
    readonly wgslType = 'vec2<i32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(vec2: Vec2);
    constructor(x: number, y: number);
    constructor(...args: (number | Vec2)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于内部创建实例
            return;
        }
        if (args.length === 1)
        {
            // 处理 vec2
            if (args[0] instanceof Vec2)
            {
                // 从 vec2 转换为 ivec2
                const vec2 = args[0] as Vec2;

                this.toGLSL = () => `ivec2(${vec2.toGLSL()})`;
                this.toWGSL = () => `vec2<i32>(${vec2.toWGSL()})`;
                this.dependencies = [vec2];
            }
            else
            {
                throw new Error('IVec2 constructor: invalid argument');
            }
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = () => `ivec2(${x}, ${y})`;
            this.toWGSL = () => `vec2<i32>(${x}, ${y})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('IVec2 constructor: invalid arguments');
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
     * 加法运算
     */
    add(other: IVec2): IVec2
    {
        const result = new (IVec2 as any)();
        result.toGLSL = () => `${this.toGLSL()} + ${other.toGLSL()}`;
        result.toWGSL = () => `${this.toWGSL()} + ${other.toWGSL()}`;
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     * @param other 另一个 IVec2 或数字（标量广播）
     */
    subtract(other: IVec2 | number): IVec2
    {
        const result = new (IVec2 as any)();
        if (typeof other === 'number')
        {
            // 标量减法（广播）
            result.toGLSL = () => `${this.toGLSL()} - ${other}`;
            result.toWGSL = () => `${this.toWGSL()} - vec2<i32>(${other})`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} - ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} - ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }
}

/**
 * ivec2 构造函数（无参数）
 */
export function ivec2(): IVec2;
/**
 * ivec2 构造函数
 */
export function ivec2(vec2: Vec2): IVec2;
export function ivec2(x: number, y: number): IVec2;
export function ivec2(...args: any[]): IVec2
{
    return new (IVec2 as any)(...args);
}

