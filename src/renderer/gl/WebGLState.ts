import { BlendEquation } from '../data/RenderParams';
import { WebGLRenderer } from '../WebGLRenderer';

export class WebGLState
{
    private blendEquationCache: { [key: string]: number } = {};

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
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

        const { gl, capabilities, extensions } = this._webGLRenderer;

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
