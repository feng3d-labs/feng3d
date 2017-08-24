var feng3d;
(function (feng3d) {
    /**
     * GL扩展
     */
    var GLExtension = (function () {
        function GLExtension(gl) {
            this.cacheGLQuery(gl);
            this.extensionWebGL(gl);
            new feng3d.GLProgramExtension(gl);
        }
        /**
         * 扩展GL
         * @param gl GL实例
         */
        GLExtension.prototype.extensionWebGL = function (gl) {
            //
            gl.anisotropicExt =
                gl.getExtension('EXT_texture_filter_anisotropic')
                    || gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
                    || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            gl.maxAnisotropy = gl.getParameter(gl.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            if (!gl.webgl2) {
                var ext = gl.getExtension('OES_standard_derivatives');
                var ext1 = gl.getExtension('EXT_shader_texture_lod');
                gl.vertexAttribDivisor = function (index, divisor) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.vertexAttribDivisorANGLE(index, divisor);
                };
                gl.drawElementsInstanced = function (mode, count, type, offset, instanceCount) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
                };
            }
        };
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        GLExtension.prototype.cacheGLQuery = function (gl) {
            var extensions = {};
            var oldGetExtension = gl.getExtension;
            gl.getExtension = function (name) {
                extensions[name] = extensions[name] || oldGetExtension.apply(gl, arguments);
                return extensions[name];
            };
            //
            var oldGetParameter = gl.getParameter;
            var parameters = {};
            gl.getParameter = function (pname) {
                parameters[pname] = parameters[pname] || oldGetParameter.apply(gl, arguments);
                return parameters[pname];
            };
        };
        return GLExtension;
    }());
    feng3d.GLExtension = GLExtension;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=GLExtension.js.map