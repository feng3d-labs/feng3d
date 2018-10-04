namespace feng3d
{
    export interface GL extends WebGLRenderingContext
    {
        /**
         * 是否为 WebGL2
         */
        webgl2: boolean;

        /**
         * 上下文属性
         */
        contextAttributes: WebGLContextAttributes | undefined;

        /**
         * 上下文名称
         */
        contextId: string;

        /**
         * GL 扩展
         */
        extensions: GLExtension;

        /**
         * 渲染器
         */
        renderer: Renderer;

        /**
         * 纹理各向异性过滤最大值
         */
        maxAnisotropy: number;

        capabilities: WebGLCapabilities;
    }

    export class GL
    {
        static glList: GL[] = [];

        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes 
         */
        static getGL(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes)
        {
            // var names = ["webgl2", "webgl"];
            var contextIds = ["webgl"];
            var gl: GL = <any>null;
            for (var i = 0; i < contextIds.length; ++i)
            {
                try
                {
                    gl = <any>canvas.getContext(contextIds[i], contextAttributes);
                    gl.contextId = contextIds[i];
                    gl.contextAttributes = contextAttributes;
                    break;
                } catch (e) { }
            }
            if (!gl)
                throw "无法初始化WEBGL";
            //
            if (typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext)
                gl.webgl2 = true;
            //
            gl.capabilities = new WebGLCapabilities(gl);
            //
            new GLExtension(gl);
            new Renderer(gl);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
            this.glList.push(gl);
            return gl;
        }

        private static _toolGL: GL;
        static getToolGL()
        {
            if (!this._toolGL)
            {
                var canvas = document.createElement("canvas");
                this._toolGL = this.getGL(canvas);
            }
            return this._toolGL;
        }
    }
}