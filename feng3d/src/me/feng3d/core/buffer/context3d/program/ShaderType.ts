module me.feng3d {

    /**
     * 渲染程序类型
     */
    export enum ShaderType {
        
        /**
         * 顶点
         */
        VERTEX = WebGLRenderingContext.VERTEX_SHADER,
        
        /**
         * 片段
         */
        FRAGMENT = WebGLRenderingContext.FRAGMENT_SHADER
    }
}