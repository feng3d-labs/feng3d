namespace feng3d
{
    /**
     * A GLenum specifying the intended usage pattern of the data store for optimization purposes. 
     * 
     * 指定数据存储区的使用方法。
     * 
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     */
    export enum AttributeUsage
    {
        /**
         * The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
         * 
         * 内容由应用程序指定一次，并多次用作WebGL绘图和图像规范命令的源。
         * 
         * 缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
         */
        STATIC_DRAW = "STATIC_DRAW",
        /**
         * The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
         * 
         * 这些内容将由应用程序反复重新指定，并多次用作WebGL绘图和图像规范命令的源。
         */
        DYNAMIC_DRAW = "DYNAMIC_DRAW",
        /**
         * The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
         * 
         * 内容由应用程序指定一次，最多几次用作WebGL绘图和图像规范命令的源。
         */
        STREAM_DRAW = "STREAM_DRAW",
    }
}