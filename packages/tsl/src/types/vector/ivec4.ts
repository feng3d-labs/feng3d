import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';

/**
 * IVec4 类，用于表示 ivec4 字面量值
 * @internal 库外部不应直接使用 `new IVec4()`，应使用 `ivec4()` 函数
 */
export class IVec4 implements ShaderValue
{
    readonly glslType = 'ivec4';
    readonly wgslType = 'vec4<i32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(x: number, y: number, z: number, w: number);
    constructor(...args: number[])
    {
        if (args.length === 0)
        {
            return;
        }
        else if (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number' && typeof args[3] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            const w = args[3] as number;
            this.toGLSL = () => `ivec4(${x}, ${y}, ${z}, ${w})`;
            this.toWGSL = () => `vec4<i32>(${x}, ${y}, ${z}, ${w})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('IVec4 constructor: invalid arguments');
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
}

/**
 * ivec4 构造函数
 */
export function ivec4(): IVec4;
export function ivec4(x: number, y: number, z: number, w: number): IVec4;
export function ivec4(...args: any[]): IVec4
{
    return new (IVec4 as any)(...args);
}

