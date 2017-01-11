module feng3d {

    /**
     * 3D上下文
     * 
     * 使用较短的Context3D代替WebGLRenderingContext或者WebGL2RenderingContext
     * @author feng 2017-01-10
     */

    //webgl 1
    // export type Context3D = WebGLRenderingContext;
    // export var Context3D = WebGLRenderingContext;

    //webgl 2
    export type Context3D = WebGL2RenderingContext;
    export var Context3D = WebGL2RenderingContext;
}