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
        const { gl, capabilities, state, webGLContext } = this._webGLRenderer;

        const { cullFace, frontFace,
            enableBlend, sfactor, dfactor,
            depthtest, depthFunc, depthMask,
            colorMask,
            useViewPort, viewPort,
            usePolygonOffset, polygonOffsetFactor, polygonOffsetUnits,
            useScissor, scissor,
            useStencil, stencilFunc, stencilFuncRef, stencilFuncMask, stencilOpFail, stencilOpZFail, stencilOpZPass, stencilMask,
        } = renderParams;

        const blendEquation = state.convertBlendEquation(renderParams.blendEquation);

        if (cullFace === 'NONE')
        {
            webGLContext.disable('CULL_FACE');
        }
        else
        {
            webGLContext.enable('CULL_FACE');
            gl.cullFace(gl[cullFace]);
            gl.frontFace(gl[frontFace]);
        }

        if (enableBlend)
        {
            //
            webGLContext.enable('BLEND');
            gl.blendEquation(blendEquation);
            gl.blendFunc(gl[sfactor], gl[dfactor]);
        }
        else
        {
            webGLContext.disable('BLEND');
        }

        if (depthtest)
        {
            webGLContext.enable('DEPTH_TEST');
            gl.depthFunc(gl[depthFunc]);
        }
        else
        {
            webGLContext.disable('DEPTH_TEST');
        }

        gl.depthMask(depthMask);

        gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);

        if (useViewPort)
        {
            webGLContext.viewport(viewPort.x, viewPort.y, viewPort.width, viewPort.height);
        }
        else
        {
            webGLContext.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        if (usePolygonOffset)
        {
            webGLContext.enable('POLYGON_OFFSET_FILL');
            gl.polygonOffset(polygonOffsetFactor, polygonOffsetUnits);
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
            if (capabilities.stencilBits === 0)
            {
                console.warn(`${gl} 不支持 stencil，参考 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext WebGL context attributes: stencil`);
            }
            webGLContext.enable('STENCIL_TEST');
            gl.stencilFunc(gl[stencilFunc], stencilFuncRef, stencilFuncMask);
            gl.stencilOp(gl[stencilOpFail], gl[stencilOpZFail], gl[stencilOpZPass]);
            gl.stencilMask(stencilMask);
        }
        else
        {
            webGLContext.disable('STENCIL_TEST');
        }
    }
}
