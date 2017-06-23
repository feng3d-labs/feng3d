namespace feng3d
{
    /**
     * GL扩展
     */
    export class GLExtension
    {
        constructor(gl: GL)
        {
            this.supportIphone(gl);
            this.cacheGLQuery(gl);
            this.extensionWebGL(gl);
            new GLProgramExtension(gl);
        }

        /**
         * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
         * @param gl WebGL对象
         */
        private supportIphone(gl: GL)
        {
            for (var key in gl)
            {
                var element = gl[key];
                if (typeof element == "number" && GL[key] == undefined)
                {
                    GL[key] = element;
                }
            }
        }

        /**
         * 扩展GL
         * @param gl GL实例
         */
        private extensionWebGL(gl: GL)
        {
            //
            gl.anisotropicExt =
                gl.getExtension('EXT_texture_filter_anisotropic')
                || gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
                || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            gl.maxAnisotropy = gl.getParameter(gl.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);

            if (!gl.webgl2)
            {
                var ext = gl.getExtension('OES_standard_derivatives');
                var ext1 = gl.getExtension('EXT_shader_texture_lod');
                gl.vertexAttribDivisor = function (index: number, divisor: number)
                {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.vertexAttribDivisorANGLE(index, divisor);
                };

                gl.drawElementsInstanced = function (mode: number, count: number, type: number, offset: number, instanceCount: number)
                {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
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