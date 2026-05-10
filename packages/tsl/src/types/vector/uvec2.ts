import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';

/**
 * Uvec2 类，用于表示 uvec2 字面量值
 * @internal 库外部不应直接使用 `new Uvec2()`，应使用 `uvec2()` 函数
 */
export class Uvec2 implements ShaderValue
{
    readonly glslType = 'uvec2';
    readonly wgslType = 'vec2<u32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(x: number, y: number);
    constructor(...args: number[])
    {
        if (args.length === 0)
        {
            return;
        }
        else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            this.toGLSL = () => `uvec2(${x}, ${y})`;
            this.toWGSL = () => `vec2<u32>(${x}, ${y})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('UVec2 constructor: invalid arguments');
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
}

/**
 * uvec2 构造函数（无参数）
 */
export function uvec2(): Uvec2;
/**
 * uvec2 构造函数
 */
export function uvec2(x: number, y: number): Uvec2;
export function uvec2(...args: any[]): Uvec2
{
    return new (Uvec2 as any)(...args);
}

