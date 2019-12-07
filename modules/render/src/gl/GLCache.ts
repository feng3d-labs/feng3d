namespace feng3d
{
    /**
     * GL 缓存
     */
    export class GLCache
    {
        compileShaderResults: { [key: string]: CompileShaderResult } = {};

        private _gl: GL;

        textures = new Map<Texture, WebGLTexture>();
        
        attributes = new Map<Attribute, WebGLBuffer>();

        constructor(gl: GL)
        {
            gl.cache = this;
            this._gl = gl;
        }
    }
}