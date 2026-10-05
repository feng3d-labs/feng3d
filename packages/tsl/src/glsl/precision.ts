import { IElement } from '../core/IElement';
import { getCurrentFunc } from '../core/currentFunc';

/**
 * Precision 类型
 */
export type PrecisionType = 'float' | 'int' | 'sampler2D' | 'sampler2DArray' | 'sampler3D' | 'usampler2D' | 'isampler2D';

/**
 * Precision 类，表示 GLSL 精度声明（仅用于 fragment shader）
 * @internal 库外部不应直接使用 `new Precision()`，应使用 `precision()` 函数
 */
export class Precision implements IElement
{
    readonly value: 'lowp' | 'mediump' | 'highp';
    readonly type: PrecisionType;
    dependencies: IElement[] = [];

    constructor(value: 'lowp' | 'mediump' | 'highp', type: PrecisionType = 'float')
    {
        this.value = value;
        this.type = type;
    }

    toGLSL(): string
    {
        return `precision ${this.value} ${this.type};`;
    }

    toWGSL(): string
    {
        // WGSL 不需要 precision 声明
        return '';
    }
}

/**
 * 设置 GLSL 精度（仅用于 fragment shader）
 */
export function precision(value: 'lowp' | 'mediump' | 'highp'): Precision;
export function precision(value: 'lowp' | 'mediump' | 'highp', type: PrecisionType): Precision;
export function precision(value: 'lowp' | 'mediump' | 'highp', type: PrecisionType = 'float'): Precision
{
    const precisionInstance = new Precision(value, type);

    // 如果当前正在执行函数，将 precision 添加到依赖中
    const currentFunc = getCurrentFunc();
    if (!currentFunc)
    {
        throw new Error('precision() 必须在 fragment shader 函数中调用');
    }
    currentFunc.dependencies.push(precisionInstance);

    return precisionInstance;
}

