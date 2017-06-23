namespace feng3d
{
    export class GLProxy
    {
        public gl: GL;

        constructor(canvas: HTMLCanvasElement, options = null)
        {
            options = options || {};
            options.preferWebGl2 = false;
            var gl = this.getWebGLContext(canvas, options);
            //
            Object.defineProperty(this, "gl", { value: gl });
            Object.defineProperty(gl, "proxy", { value: this });
            Object.defineProperty(gl, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(gl, "webgl2", { value: !!gl.drawArraysInstanced });
            gl.programs = {};
            //
            new GLExtension(gl);
        }

        /** 
         * Initialize and get the rendering for WebGL
         * @param canvas <cavnas> element
         * @param opt_debug flag to initialize the context for debugging
         * @return the rendering context for WebGL
         */
        private getWebGLContext(canvas: HTMLCanvasElement, options = null)
        {
            var preferWebGl2 = (options && options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
            var names = preferWebGl2 ? ["webgl2", "experimental-webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
            var gl: GL = null;
            for (var i = 0; i < names.length; ++i)
            {
                try
                {
                    gl = <any>canvas.getContext(names[i], options);
                } catch (e) { }
                if (gl)
                {
                    break;
                }
            }
            if (!gl)
            {
                throw "无法初始化WEBGL";
            }
            return gl;
        }
    }
}