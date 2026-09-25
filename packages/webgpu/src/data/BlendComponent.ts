/**
 * 为颜色或alpha通道定义相应渲染目标的混合行为。
 *
 * @see https://gpuweb.github.io/gpuweb/#dictdef-gpucolortargetstate
 */
export interface BlendComponent
{
    /**
     * 混合方式。
     *
     * 默认为 "add"。
     *
     * 当 `operation` 值为 "min" 或 "max" 时， `srcFactor` 与 `dstFactor` 将会被引擎自动使用 "one"。
     *
     * 对于 alpha 通道，未设置时会继承 color 通道的设置。
     */
    readonly operation?: BlendOperation;

    /**
     * 源混合因子。
     *
     * 默认为 "src-alpha"。
     *
     * 对于 alpha 通道，未设置时会继承 color 通道的设置。
     */
    readonly srcFactor?: BlendFactor;

    /**
     * 目标混合因子。
     *
     * 默认为 "one-minus-src-alpha"。
     *
     * 对于 alpha 通道，未设置时会继承 color 通道的设置。
     */
    readonly dstFactor?: BlendFactor;
}

export type BlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';

/**
 * @see https://gpuweb.github.io/gpuweb/#enumdef-gpublendfactor
 */
export type BlendFactor = IBlendFactorMap[keyof IBlendFactorMap];

export interface IBlendFactorMap
{
    'zero': 'zero';
    'one': 'one';
    'src': 'src';
    'one-minus-src': 'one-minus-src';
    'src-alpha': 'src-alpha';
    'one-minus-src-alpha': 'one-minus-src-alpha';
    'dst': 'dst';
    'one-minus-dst': 'one-minus-dst';
    'dst-alpha': 'dst-alpha';
    'one-minus-dst-alpha': 'one-minus-dst-alpha';
    'src-alpha-saturated': 'src-alpha-saturated';
    'constant': 'constant';
    'one-minus-constant': 'one-minus-constant';
}

/**
 * 默认混合组件配置。
 */
export const defaultBlendComponent: BlendComponent = {
    operation: 'add',
    srcFactor: 'src-alpha',
    dstFactor: 'one-minus-src-alpha',
};
