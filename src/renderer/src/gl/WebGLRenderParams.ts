import { RenderParams } from '../data/RenderParams';
import { WebGLRenderer } from '../WebGLRenderer';

export class WebGLRenderParams
{
    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * 更新渲染参数
     */
    updateRenderParams(renderParams: RenderParams)
    {
        const { webGLContext, width, height } = this._webGLRenderer;

        const { cullFace, frontFace,
            enableBlend, blendEquation, sfactor, dfactor,
            depthtest, depthFunc, depthMask,
            colorMask,
            useViewPort, viewPort,
            usePolygonOffset, polygonOffsetFactor, polygonOffsetUnits,
            useScissor, scissor,
            useStencil, stencilFunc, stencilFuncRef, stencilFuncMask, stencilOpFail, stencilOpZFail, stencilOpZPass, stencilMask,
        } = renderParams;

        if (cullFace === 'NONE')
        {
            webGLContext.disable('CULL_FACE');
        }
        else
        {
            webGLContext.enable('CULL_FACE');
            webGLContext.cullFace(cullFace);
            webGLContext.frontFace(frontFace);
        }

        if (enableBlend)
        {
            //
            webGLContext.enable('BLEND');
            webGLContext.blendEquation(blendEquation);
            webGLContext.blendFunc(sfactor, dfactor);
        }
        else
        {
            webGLContext.disable('BLEND');
        }

        if (depthtest)
        {
            webGLContext.enable('DEPTH_TEST');
            webGLContext.depthFunc(depthFunc);
        }
        else
        {
            webGLContext.disable('DEPTH_TEST');
        }

        webGLContext.depthMask(depthMask);

        webGLContext.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);

        if (useViewPort)
        {
            webGLContext.viewport(viewPort.x, viewPort.y, viewPort.width, viewPort.height);
        }
        else
        {
            webGLContext.viewport(0, 0, width, height);
        }

        if (usePolygonOffset)
        {
            webGLContext.enable('POLYGON_OFFSET_FILL');
            webGLContext.polygonOffset(polygonOffsetFactor, polygonOffsetUnits);
        }
        else
        {
            webGLContext.disable('POLYGON_OFFSET_FILL');
        }

        if (useScissor)
        {
            webGLContext.enable('SCISSOR_TEST');
            webGLContext.scissor(scissor.x, scissor.y, scissor.width, scissor.height);
        }
        else
        {
            webGLContext.disable('SCISSOR_TEST');
        }

        if (useStencil)
        {
            webGLContext.enable('STENCIL_TEST');
            webGLContext.stencilFunc(stencilFunc, stencilFuncRef, stencilFuncMask);
            webGLContext.stencilOp(stencilOpFail, stencilOpZFail, stencilOpZPass);
            webGLContext.stencilMask(stencilMask);
        }
        else
        {
            webGLContext.disable('STENCIL_TEST');
        }
    }
}
