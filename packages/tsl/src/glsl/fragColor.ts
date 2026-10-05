import { IElement } from '../core/IElement';

/**
 * FragColor 类，表示 fragment shader 的输出 location
 * @internal 库外部不应直接使用 `new FragColor()`，应使用 `fragColor()` 函数
 */
export class FragColor implements IElement
{
    readonly location: number;
    readonly name: string;
    dependencies: IElement[] = [];
    toGLSL: () => string;
    toWGSL: () => string;

    constructor(location: number, name?: string)
    {
        this.location = location;
        this.name = name ?? `fragColor${location}`;
        this.toGLSL = () => this.name;
        this.toWGSL = () => this.name;
    }
}

/**
 * 创建 fragment shader 输出 location
 */
export function fragColor(location: number): FragColor;
export function fragColor(location: number, name: string): FragColor;
export function fragColor(location: number, name?: string): FragColor
{
    return new FragColor(location, name);
}
