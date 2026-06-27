import type { PrimitiveState } from '../data/PrimitiveState';
import type { DepthStencilState } from '../data/DepthStencilState';

/**
 * 渲染模式枚举 (WebGL 兼容层)
 */
export enum RenderMode
{
    POINTS = 'point-list',
    LINES = 'line-list',
    LINE_STRIP = 'line-strip',
    LINE_LOOP = 'line-list',
    TRIANGLES = 'triangle-list',
    TRIANGLE_STRIP = 'triangle-strip',
    TRIANGLE_FAN = 'triangle-list',
}

/**
 * 颜色掩码 (WebGL 兼容层)
 */
export interface ColorMask
{
    r: boolean;
    g: boolean;
    b: boolean;
    a: boolean;
}

/**
 * 混合方程 (WebGL 兼容层)
 */
export enum BlendEquation
{
    FUNC_ADD = 'add',
    FUNC_SUBTRACT = 'subtract',
    FUNC_REVERSE_SUBTRACT = 'reverse-subtract',
    MIN = 'min',
    MAX = 'max',
}

/**
 * 混合因子 (WebGL 兼容层)
 */
export enum BlendFactor
{
    ZERO = 'zero',
    ONE = 'one',
    SRC_COLOR = 'src',
    ONE_MINUS_SRC_COLOR = 'one-minus-src',
    DST_COLOR = 'dst',
    ONE_MINUS_DST_COLOR = 'one-minus-dst',
    SRC_ALPHA = 'src-alpha',
    ONE_MINUS_SRC_ALPHA = 'one-minus-src-alpha',
    DST_ALPHA = 'dst-alpha',
    ONE_MINUS_DST_ALPHA = 'one-minus-dst-alpha',
    SRC_ALPHA_SATURATE = 'src-alpha-saturated',
    CONSTANT_COLOR = 'constant',
    ONE_MINUS_CONSTANT_COLOR = 'one-minus-constant',
    CONSTANT_ALPHA = 'constant-alpha',
    ONE_MINUS_CONSTANT_ALPHA = 'one-minus-constant-alpha',
}

/**
 * 背面剔除 (WebGL 兼容层)
 */
export enum CullFace
{
    NONE = 'none',
    FRONT = 'front',
    BACK = 'back',
    FRONT_AND_BACK = 'all',
}

/**
 * 正面方向 (WebGL 兼容层)
 */
export enum FrontFace
{
    CW = 'cw',
    CCW = 'ccw',
}

/**
 * 深度测试函数 (WebGL 兼容层)
 */
export enum DepthFunc
{
    NEVER = 'never',
    LESS = 'less',
    EQUAL = 'equal',
    LEQUAL = 'less-equal',
    GREATER = 'greater',
    GEQUAL = 'greater-equal',
    NOTEQUAL = 'not-equal',
    ALWAYS = 'always',
}

/**
 * 模板测试函数 (WebGL 兼容层)
 */
export enum StencilFunc
{
    NEVER = 'never',
    LESS = 'less',
    EQUAL = 'equal',
    LEQUAL = 'less-equal',
    GREATER = 'greater',
    GEQUAL = 'greater-equal',
    NOTEQUAL = 'not-equal',
    ALWAYS = 'always',
}

/**
 * 模板操作 (WebGL 兼容层)
 */
export enum StencilOp
{
    KEEP = 'keep',
    ZERO = 'zero',
    REPLACE = 'replace',
    INVERT = 'invert',
    INCREMENT_CLAMP = 'increment-clamp',
    DECREMENT_CLAMP = 'decrement-clamp',
    INCREMENT_WRAP = 'increment-wrap',
    DECREMENT_WRAP = 'decrement-wrap',
}

/**
 * 渲染参数 (WebGL 兼容层)
 */
export interface RenderParams
{
    /**
     * 渲染模式
     */
    renderMode?: RenderMode;

    /**
     * 是否启用混合
     */
    enableBlend?: boolean;

    /**
     * 混合方程 RGB
     */
    blendEquationRGB?: BlendEquation;

    /**
     * 混合方程 Alpha
     */
    blendEquationAlpha?: BlendEquation;

    /**
     * 源混合因子 RGB
     */
    blendSrcRGB?: BlendFactor;

    /**
     * 源混合因子 Alpha
     */
    blendSrcAlpha?: BlendFactor;

    /**
     * 目标混合因子 RGB
     */
    blendDstRGB?: BlendFactor;

    /**
     * 目标混合因子 Alpha
     */
    blendDstAlpha?: BlendFactor;

    /**
     * 是否启用深度测试
     */
    enableDepthTest?: boolean;

    /**
     * 深度测试函数
     */
    depthFunc?: DepthFunc;

    /**
     * 是否启用深度写入
     */
    enableDepthMask?: boolean;

    /**
     * 是否启用模板测试
     */
    enableStencilTest?: boolean;

    /**
     * 模板测试函数
     */
    stencilFunc?: StencilFunc;

    /**
     * 模板参考值
     */
    stencilRef?: number;

    /**
     * 模板掩码
     */
    stencilMask?: number;

    /**
     * 模板操作 - 模板测试失败
     */
    stencilFailOp?: StencilOp;

    /**
     * 模板操作 - 深度测试失败
     */
    stencilDepthFailOp?: StencilOp;

    /**
     * 模板操作 - 深度和模板测试都通过
     */
    stencilPassOp?: StencilOp;

    /**
     * 背面剔除模式
     */
    cullFace?: CullFace;

    /**
     * 正面方向
     */
    frontFace?: FrontFace;

    /**
     * 颜色掩码
     */
    colorMask?: ColorMask;

    /**
     * 是否使用视口
     */
    useViewPort?: boolean;

    /**
     * 视口
     */
    viewPort?: { x: number; y: number; width: number; height: number };
}

/**
 * 渲染参数类 (WebGL 兼容层)
 */
export class RenderParamsClass implements RenderParams
{
    renderMode?: RenderMode;
    enableBlend?: boolean;
    blendEquationRGB?: BlendEquation;
    blendEquationAlpha?: BlendEquation;
    blendSrcRGB?: BlendFactor;
    blendSrcAlpha?: BlendFactor;
    blendDstRGB?: BlendFactor;
    blendDstAlpha?: BlendFactor;
    enableDepthTest?: boolean;
    depthFunc?: DepthFunc;
    enableDepthMask?: boolean;
    enableStencilTest?: boolean;
    stencilFunc?: StencilFunc;
    stencilRef?: number;
    stencilMask?: number;
    stencilFailOp?: StencilOp;
    stencilDepthFailOp?: StencilOp;
    stencilPassOp?: StencilOp;
    cullFace?: CullFace;
    frontFace?: FrontFace;
    colorMask?: ColorMask;
    useViewPort?: boolean;
    viewPort?: { x: number; y: number; width: number; height: number };

    /**
     * 转换为 WebGPU PrimitiveState
     */
    toPrimitiveState(): PrimitiveState
    {
        let cullFace: 'none' | 'front' | 'back' = 'none';
        if (this.cullFace === CullFace.FRONT) cullFace = 'front';
        else if (this.cullFace === CullFace.BACK) cullFace = 'back';

        return {
            topology: this.renderMode || RenderMode.TRIANGLES,
            cullFace,
            frontFace: this.frontFace || FrontFace.CCW,
        };
    }

    /**
     * 转换为 WebGPU DepthStencilState
     */
    toDepthStencilState(): DepthStencilState
    {
        return {
            depthWriteEnabled: this.enableDepthMask ?? true,
            depthCompare: this.depthFunc || DepthFunc.LESS,
            stencilFront: {
                compare: this.stencilFunc || StencilFunc.ALWAYS,
                failOp: this.stencilFailOp || StencilOp.KEEP,
                depthFailOp: this.stencilDepthFailOp || StencilOp.KEEP,
                passOp: this.stencilPassOp || StencilOp.KEEP,
            },
            stencilBack: {
                compare: this.stencilFunc || StencilFunc.ALWAYS,
                failOp: this.stencilFailOp || StencilOp.KEEP,
                depthFailOp: this.stencilDepthFailOp || StencilOp.KEEP,
                passOp: this.stencilPassOp || StencilOp.KEEP,
            },
            stencilReadMask: this.stencilMask ?? 0xFFFFFFFF,
            stencilWriteMask: this.stencilMask ?? 0xFFFFFFFF,
        };
    }

    /**
     * 转换为 WebGPU 混合组件
     */
    toBlendComponent(): { color: GPUBlendComponent; alpha: GPUBlendComponent } | undefined
    {
        if (!this.enableBlend) return undefined;

        return {
            color: {
                srcFactor: convertBlendFactor(this.blendSrcRGB || BlendFactor.ONE),
                dstFactor: convertBlendFactor(this.blendDstRGB || BlendFactor.ZERO),
                operation: convertBlendOperation(this.blendEquationRGB || BlendEquation.FUNC_ADD),
            },
            alpha: {
                srcFactor: convertBlendFactor(this.blendSrcAlpha || BlendFactor.ONE),
                dstFactor: convertBlendFactor(this.blendDstAlpha || BlendFactor.ZERO),
                operation: convertBlendOperation(this.blendEquationAlpha || BlendEquation.FUNC_ADD),
            },
        };
    }
}

/**
 * 转换混合因子
 */
function convertBlendFactor(factor: BlendFactor): GPUBlendFactor
{
    const map: Record<BlendFactor, GPUBlendFactor> = {
        [BlendFactor.ZERO]: 'zero',
        [BlendFactor.ONE]: 'one',
        [BlendFactor.SRC_COLOR]: 'src',
        [BlendFactor.ONE_MINUS_SRC_COLOR]: 'one-minus-src',
        [BlendFactor.DST_COLOR]: 'dst',
        [BlendFactor.ONE_MINUS_DST_COLOR]: 'one-minus-dst',
        [BlendFactor.SRC_ALPHA]: 'src-alpha',
        [BlendFactor.ONE_MINUS_SRC_ALPHA]: 'one-minus-src-alpha',
        [BlendFactor.DST_ALPHA]: 'dst-alpha',
        [BlendFactor.ONE_MINUS_DST_ALPHA]: 'one-minus-dst-alpha',
        [BlendFactor.SRC_ALPHA_SATURATE]: 'src-alpha-saturated',
        [BlendFactor.CONSTANT_COLOR]: 'constant',
        [BlendFactor.ONE_MINUS_CONSTANT_COLOR]: 'one-minus-constant',
        // WebGPU 不支持 constant-alpha，映射为 constant
        [BlendFactor.CONSTANT_ALPHA]: 'constant',
        [BlendFactor.ONE_MINUS_CONSTANT_ALPHA]: 'one-minus-constant',
    };
    return map[factor] || 'one';
}

/**
 * 转换混合操作
 */
function convertBlendOperation(operation: BlendEquation): GPUBlendOperation
{
    const map: Record<BlendEquation, GPUBlendOperation> = {
        [BlendEquation.FUNC_ADD]: 'add',
        [BlendEquation.FUNC_SUBTRACT]: 'subtract',
        [BlendEquation.FUNC_REVERSE_SUBTRACT]: 'reverse-subtract',
        [BlendEquation.MIN]: 'min',
        [BlendEquation.MAX]: 'max',
    };
    return map[operation] || 'add';
}