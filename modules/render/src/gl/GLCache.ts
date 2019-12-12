namespace feng3d
{
    /**
     * GL 缓存
     */
    export class GLCache
    {
        compileShaderResults: { [key: string]: CompileShaderResult } = {};

        private _gl: GL;

        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        textures = new Map<Texture, WebGLTexture>();

        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        attributes = new Map<Attribute, WebGLBuffer>();

        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        indices = new Map<Index, WebGLBuffer>();

        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        renderBuffers = new Map<RenderBuffer, WebGLBuffer>();

        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBuffers = new Map<FrameBuffer, WebGLFramebuffer>();

        constructor(gl: GL)
        {
            gl.cache = this;
            this._gl = gl;
        }
    }
}