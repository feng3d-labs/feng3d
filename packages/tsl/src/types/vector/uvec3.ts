import { IElement, ShaderValue } from '../../core/IElement';
import { Float } from '../scalar/float';

/**
 * Uvec3 类，用于表示 uvec3 字面量值
 * @internal 库外部不应直接使用 `new Uvec3()`，应使用 `uvec3()` 函数
 */
export class Uvec3 implements ShaderValue
{
    readonly glslType = 'uvec3';
    readonly wgslType = 'vec3<u32>';

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
            this.toGLSL = () => `uvec3(${x}, ${y}, ${z})`;
            this.toWGSL = () => `vec3<u32>(${x}, ${y}, ${z})`;
            this.dependencies = [];
        }
        else
        {
            throw new Error('Uvec3 constructor: invalid arguments');
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
 * uvec3 构造函数
 */
export function uvec3(): Uvec3;
export function uvec3(x: number, y: number, z: number): Uvec3;
export function uvec3(...args: any[]): Uvec3
{
    return new (Uvec3 as any)(...args);
}

