import { BlendEquation } from '../data/RenderParams';
import { WebGLCapabilities } from './WebGLCapabilities';
import { WebGLExtensions } from './WebGLExtensions';

export class WebGLState
{
    private gl: WebGLRenderingContext;
    private extensions: WebGLExtensions;
    private capabilities: WebGLCapabilities;
    private blendEquationCache: { [key: string]: number } = {};

    constructor(gl: WebGLRenderingContext, extensions: WebGLExtensions, capabilities: WebGLCapabilities)
    {
        this.gl = gl;
        this.extensions = extensions;
        this.capabilities = capabilities;
    }

    /**
     * 转换WebGL中混合方法对应值。
     *
     * @param blendEquation 混合方法
     * @returns WebGL中混合方法对应值。
     */
    convertBlendEquation(blendEquation: BlendEquation)
    {
        if (this.blendEquationCache[blendEquation])
        {
            return this.blendEquationCache[blendEquation];
        }

        const { gl, capabilities, extensions } = this;

        let value: number;
        if (blendEquation === 'MIN' || blendEquation === 'MAX')
        {
            if (capabilities.isWebGL2)
            {
                value = gl[blendEquation];
            }
            else
            {
                const extension = extensions.get('EXT_blend_minmax');

                if (extension !== null)
                {
                    if (blendEquation === 'MIN')
                    {
                        value = extension.MIN_EXT;
                    }
                    if (blendEquation === 'MAX')
                    {
                        value = extension.MAX_EXT;
                    }
                }
            }
        }
        else
        {
            value = gl[blendEquation];
        }

        this.blendEquationCache[blendEquation] = value;

        return value;
    }
}
