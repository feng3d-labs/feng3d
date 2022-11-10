import { RenderParams } from '../data/RenderParams';
import { WebGLCapabilities } from './WebGLCapabilities';
import { WebGLState } from './WebGLState';

export class WebGLRenderParams
{
    gl: WebGLRenderingContext;
    capabilities: WebGLCapabilities;
    state: WebGLState;

    constructor(gl: WebGLRenderingContext, capabilities: WebGLCapabilities, state: WebGLState)
    {
        this.gl = gl;
        this.capabilities = capabilities;
        this.state = state;
    }

    /**
     * 更新渲染参数
     */
    updateRenderParams(renderParams: RenderParams)
    {
        const { gl, capabilities, state } = this;

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
            gl.disable(gl.CULL_FACE);
        }
        else
        {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl[cullFace]);
            gl.frontFace(gl[frontFace]);
        }

        if (enableBlend)
        {
            //
            gl.enable(gl.BLEND);
            gl.blendEquation(blendEquation);
            gl.blendFunc(gl[sfactor], gl[dfactor]);
        }
        else
        {
            gl.disable(gl.BLEND);
        }

        if (depthtest)
        {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl[depthFunc]);
        }
        else
        {
            gl.disable(gl.DEPTH_TEST);
        }

        gl.depthMask(depthMask);

        gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);

        if (useViewPort)
        {
            gl.viewport(viewPort.x, viewPort.y, viewPort.width, viewPort.height);
        }
        else
        {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        if (usePolygonOffset)
        {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(polygonOffsetFactor, polygonOffsetUnits);
        }
        else
        {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }

        if (useScissor)
        {
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height);
        }
        else
        {
            gl.disable(gl.SCISSOR_TEST);
        }

        if (useStencil)
        {
            if (capabilities.stencilBits === 0)
            {
                console.warn(`${gl} 不支持 stencil，参考 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext WebGL context attributes: stencil`);
            }
            gl.enable(gl.STENCIL_TEST);
            gl.stencilFunc(gl[stencilFunc], stencilFuncRef, stencilFuncMask);
            gl.stencilOp(gl[stencilOpFail], gl[stencilOpZFail], gl[stencilOpZPass]);
            gl.stencilMask(stencilMask);
        }
        else
        {
            gl.disable(gl.STENCIL_TEST);
        }
    }
}
