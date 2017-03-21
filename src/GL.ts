module feng3d
{

    /**
     * 3D上下文
     * 
     * 使用较短的GL代替WebGLRenderingContext或者WebGL2RenderingContext
     * @author feng 2017-01-10
     */

    //webgl 1
    export type GL = WebGLRenderingContext;
    export var GL = WebGLRenderingContext;
}