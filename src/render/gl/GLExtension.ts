interface EXTTextureFilterAnisotropic
{
    /**
     * 纹理各向异性过滤最大值
     */
    maxAnisotropy: number;

    /**
     * 设置纹理各向异性 值
     */
    texParameterf(textureType: number, anisotropy: number): void;
}

namespace feng3d
{
    /**
     * GL扩展
     */
    export class GLExtension
    {
        aNGLEInstancedArrays: ANGLEInstancedArrays;
        eXTBlendMinMax: EXTBlendMinMax;
        eXTColorBufferHalfFloat: EXTColorBufferHalfFloat;
        eXTFragDepth: EXTFragDepth;
        eXTsRGB: EXTsRGB;
        eXTShaderTextureLOD: EXTShaderTextureLOD;
        eXTTextureFilterAnisotropic: EXTTextureFilterAnisotropic;
        oESElementIndexUint: OESElementIndexUint;
        oESStandardDerivatives: OESStandardDerivatives;
        oESTextureFloat: OESTextureFloat;
        oESTextureFloatLinear: OESTextureFloatLinear;
        oESTextureHalfFloat: OESTextureHalfFloat;
        oESTextureHalfFloatLinear: OESTextureHalfFloatLinear;
        oESVertexArrayObject: OESVertexArrayObject;
        webGLColorBufferFloat: WebGLColorBufferFloat;
        webGLCompressedTextureATC: WebGLCompressedTextureATC;
        webGLCompressedTextureETC1: WebGLCompressedTextureETC1;
        webGLCompressedTexturePVRTC: WebGLCompressedTexturePVRTC;
        webGLCompressedTextureS3TC: WebGLCompressedTextureS3TC;
        webGLDebugRendererInfo: WebGLDebugRendererInfo;
        webGLDebugShaders: WebGLDebugShaders;
        webGLDepthTexture: WebGLDepthTexture;
        webGLDrawBuffers: WebGLDrawBuffers;
        webGLLoseContext: WebGLLoseContext;

        constructor(gl: GL)
        {
            assert(!gl.extensions, `${gl} ${gl.extensions} 存在！`);
            gl.extensions = this;

            this.initExtensions(gl);

            this.cacheGLQuery(gl);
            new GLProgramExtension(gl);
        }

        private initExtensions(gl: feng3d.GL)
        {
            this.aNGLEInstancedArrays = gl.getExtension("ANGLE_instanced_arrays");
            this.eXTBlendMinMax = gl.getExtension("EXT_blend_minmax");
            this.eXTColorBufferHalfFloat = gl.getExtension("EXT_color_buffer_half_float");
            this.eXTFragDepth = gl.getExtension("EXT_frag_depth");
            this.eXTsRGB = gl.getExtension("EXT_sRGB");
            this.eXTShaderTextureLOD = gl.getExtension("EXT_shader_texture_lod");
            this.eXTTextureFilterAnisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
            this.oESElementIndexUint = gl.getExtension("OES_element_index_uint");
            this.oESStandardDerivatives = gl.getExtension("OES_standard_derivatives");
            this.oESTextureFloat = gl.getExtension("OES_texture_float");
            this.oESTextureFloatLinear = gl.getExtension("OES_texture_float_linear");
            this.oESTextureHalfFloat = gl.getExtension("OES_texture_half_float");
            this.oESTextureHalfFloatLinear = gl.getExtension("OES_texture_half_float_linear");
            this.oESVertexArrayObject = gl.getExtension("OES_vertex_array_object");
            this.webGLColorBufferFloat = gl.getExtension("WEBGL_color_buffer_float");
            this.webGLCompressedTextureATC = gl.getExtension("WEBGL_compressed_texture_atc");
            this.webGLCompressedTextureETC1 = gl.getExtension("WEBGL_compressed_texture_etc1");
            this.webGLCompressedTexturePVRTC = gl.getExtension("WEBGL_compressed_texture_pvrtc");
            this.webGLCompressedTextureS3TC = gl.getExtension("WEBGL_compressed_texture_s3tc");
            this.webGLDebugRendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
            this.webGLDebugShaders = gl.getExtension("WEBGL_debug_shaders");
            this.webGLDepthTexture = gl.getExtension("WEBGL_depth_texture");
            this.webGLDrawBuffers = gl.getExtension("WEBGL_draw_buffers");
            this.webGLLoseContext = gl.getExtension("WEBGL_lose_context");
            // Prefixed versions appearing in the wild as per September 2015
            this.eXTTextureFilterAnisotropic = this.eXTTextureFilterAnisotropic || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
            this.webGLCompressedTextureATC = this.webGLCompressedTextureATC || gl.getExtension("WEBKIT_WEBGL_compressed_texture_atc");
            this.webGLCompressedTexturePVRTC = this.webGLCompressedTexturePVRTC || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
            this.webGLCompressedTextureS3TC = this.webGLCompressedTextureS3TC || gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
            this.webGLDepthTexture = this.webGLDepthTexture || gl.getExtension("WEBKIT_WEBGL_depth_texture");
            this.webGLLoseContext = this.webGLLoseContext || gl.getExtension("WEBKIT_WEBGL_lose_context");
            this.webGLCompressedTextureS3TC = this.webGLCompressedTextureS3TC || gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc");
            this.webGLDepthTexture = this.webGLDepthTexture || gl.getExtension("MOZ_WEBGL_depth_texture");
            this.webGLLoseContext = this.webGLLoseContext || gl.getExtension("MOZ_WEBGL_lose_context");

            //
            var eXTTextureFilterAnisotropic = this.eXTTextureFilterAnisotropic;
            if (eXTTextureFilterAnisotropic)
            {
                var maxAnisotropy = eXTTextureFilterAnisotropic.maxAnisotropy = gl.getParameter(eXTTextureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                eXTTextureFilterAnisotropic.texParameterf = (textureType: number, anisotropy: number) =>
                {
                    if (anisotropy > maxAnisotropy)
                    {
                        anisotropy = maxAnisotropy;
                        warn(`${anisotropy} 超出 maxAnisotropy 的最大值 ${maxAnisotropy} ！,使用最大值替换。`);
                    }
                    gl.texParameterf(textureType, eXTTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                };
            }
        }

        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        private cacheGLQuery(gl: GL)
        {
            var extensions = {};
            var oldGetExtension = gl.getExtension;
            gl.getExtension = function (name: string)
            {
                extensions[name] = extensions[name] || oldGetExtension.apply(gl, arguments);
                return extensions[name];
            }
            //
            var oldGetParameter = gl.getParameter;
            var parameters = {};
            gl.getParameter = function (pname: number)
            {
                parameters[pname] = parameters[pname] || oldGetParameter.apply(gl, arguments)
                return parameters[pname];
            }
        }
    }
}