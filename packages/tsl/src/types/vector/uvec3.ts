import { IElement, ShaderValue } from '../../core/IElement';
import { bindToVariableHost, isVariableHost, type VariableHost } from '../../core/variableHost';
import { UInt } from '../scalar/uint';

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
    constructor(host: VariableHost);
    constructor(...args: (number | VariableHost)[])
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
        else if (args.length === 1 && isVariableHost(args[0]))
        {
            // 绑定到变量宿主（uniform / builtin / storage 等），供 vec3<u32> 类型的引用使用
            bindToVariableHost(this, args[0] as VariableHost);
        }
        else
        {
            throw new Error('Uvec3 constructor: invalid arguments');
        }
    }

    /**
     * 获取 x 分量
     */
    get x(): UInt
    {
        const value = new UInt();
        value.toGLSL = () => `${this.toGLSL()}.x`;
        value.toWGSL = () => `${this.toWGSL()}.x`;
        value.dependencies = [this];

        return value;
    }

    /**
     * 获取 y 分量
     */
    get y(): UInt
    {
        const value = new UInt();
        value.toGLSL = () => `${this.toGLSL()}.y`;
        value.toWGSL = () => `${this.toWGSL()}.y`;
        value.dependencies = [this];

        return value;
    }

    /**
     * 获取 z 分量
     */
    get z(): UInt
    {
        const value = new UInt();
        value.toGLSL = () => `${this.toGLSL()}.z`;
        value.toWGSL = () => `${this.toWGSL()}.z`;
        value.dependencies = [this];

        return value;
    }
}

/**
 * uvec3 构造函数
 */
export function uvec3(): Uvec3;
export function uvec3(x: number, y: number, z: number): Uvec3;
export function uvec3(host: VariableHost): Uvec3;
export function uvec3(...args: (number | VariableHost)[]): Uvec3
{
    return new (Uvec3 as new (...args: (number | VariableHost)[]) => Uvec3)(...args);
}

