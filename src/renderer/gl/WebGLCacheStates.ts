import { FunctionPropertyNames } from '@feng3d/polyfill';

/**
 * 缓存WebGL状态
 */
export class WebGLCacheStates
{
    gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext)
    {
        this.gl = gl;

        this.cacheRenderParams();
    }

    private cacheRenderParams()
    {
        const { gl } = this;

        const enableMap = {};
        const oldEnable = gl.enable;
        gl.enable = (cap) =>
        {
            if (enableMap[cap] === true) return;
            oldEnable.call(gl, cap);
            enableMap[cap] = true;
        };

        const oldDisable = gl.disable;
        gl.disable = (cap) =>
        {
            if (enableMap[cap] === false) return;
            oldDisable.call(gl, cap);
            enableMap[cap] = false;
        };

        cacheFunction(gl, 'cullFace');
        cacheFunction(gl, 'frontFace');
        cacheFunction(gl, 'blendEquation');
        cacheFunction(gl, 'blendFunc');
        cacheFunction(gl, 'depthFunc');
        cacheFunction(gl, 'depthMask');
        cacheFunction(gl, 'colorMask');
        cacheFunction(gl, 'viewport');
        cacheFunction(gl, 'useProgram');
        cacheFunction(gl, 'polygonOffset');
        cacheFunction(gl, 'scissor');
        cacheFunction(gl, 'stencilFunc');
        cacheFunction(gl, 'stencilOp');
        cacheFunction(gl, 'stencilMask');
    }
}

function cacheFunction<T>(gl: T, funcName: FunctionPropertyNames<T>)
{
    let cacheParams: any[] = [];
    const oldBlendFunc = gl[funcName] as any as Function;
    gl[funcName] = ((...params: any[]) =>
    {
        const equal = params.every((_v, i, arr) => arr[i] === cacheParams[i]);
        if (equal) return;

        cacheParams = params.concat();
        const result = oldBlendFunc.apply(gl, params);

        return result;
    }) as any;
}
