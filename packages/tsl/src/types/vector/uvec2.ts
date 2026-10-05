import { IElement, ShaderValue } from '../../core/IElement';
import { bindToVariableHost, isVariableHost, type VariableHost } from '../../core/variableHost';
import { UInt } from '../scalar/uint';

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
    constructor(x: UInt, y: UInt);
    constructor(host: VariableHost);
    constructor(...args: (number | UInt | VariableHost)[])
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
        else if (args.length === 2 && args[0] instanceof UInt && args[1] instanceof UInt)
        {
            // 两个 u32 分量（如 uvec2(uint(x), uint(y))）——Gpu 上是 vec2<u32>
            const x = args[0] as UInt;
            const y = args[1] as UInt;
            this.toGLSL = () => `uvec2(${x.toGLSL()}, ${y.toGLSL()})`;
            this.toWGSL = () => `vec2<u32>(${x.toWGSL()}, ${y.toWGSL()})`;
            this.dependencies = [x, y];
        }
        else if (args.length === 1 && isVariableHost(args[0]))
        {
            // 绑定到变量宿主（uniform / builtin / attribute），供 uvec2 类型的引用使用
            bindToVariableHost(this, args[0] as VariableHost);
        }
        else
        {
            throw new Error('UVec2 constructor: invalid arguments');
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
}

/**
 * uvec2 构造函数（无参数）
 */
export function uvec2(): Uvec2;
/**
 * uvec2 构造函数
 */
export function uvec2(x: number, y: number): Uvec2;
/**
 * uvec2 构造函数（包裹变量宿主：uniform / attribute / builtin）
 *
 * @param host 变量宿主
 * @returns uvec2 实例
 */
export function uvec2(host: VariableHost): Uvec2;
/**
 * uvec2 构造函数（两个 u32 分量）
 *
 * @param x x 分量
 * @param y y 分量
 * @returns uvec2 实例
 */
export function uvec2(x: UInt, y: UInt): Uvec2;
export function uvec2(...args: (number | UInt | VariableHost)[]): Uvec2
{
    return new (Uvec2 as new (...args: (number | UInt | VariableHost)[]) => Uvec2)(...args);
}

