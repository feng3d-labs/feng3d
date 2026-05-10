import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';

/**
 * IVec3 类，用于表示 ivec3 字面量值
 * @internal 库外部不应直接使用 `new IVec3()`，应使用 `ivec3()` 函数
 */
export class IVec3 implements ShaderValue
{
    readonly glslType = 'ivec3';
    readonly wgslType = 'vec3<i32>';

    dependencies: IElement[];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor();
    constructor(x: number, y: number, z: number);
    constructor(...args: number[])
    {
        if (args.length === 0)
        {
            return;
        }
        else if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number')
        {
            const x = args[0] as number;
            const y = args[1] as number;
            const z = args[2] as number;
            this.toGLSL = () => `ivec3(${x}, ${y}, ${z})`;
            this.toWGSL = () => `vec3<i32>(${x}, ${y}, ${z})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('IVec3 constructor: invalid arguments');
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
}

/**
 * ivec3 构造函数
 */
export function ivec3(): IVec3;
export function ivec3(x: number, y: number, z: number): IVec3;
export function ivec3(...args: any[]): IVec3
{
    return new (IVec3 as any)(...args);
}
