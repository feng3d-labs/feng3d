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
         * GL 枚举
         */
        enums: GLEnum;

        /**
         * WebWG2.0 或者 扩展功能
         */
        advanced: GLAdvanced;
    }

    export class GL
    {
        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes 
         */
        static getGL(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes)
        {
            // var names = ["webgl2", "webgl"];
            var names = ["webgl"];
            var gl: GL = <any>null;
            for (var i = 0; i < names.length; ++i)
            {
                try
                {
                    gl = <any>canvas.getContext(names[i], contextAttributes);
                    gl.contextId = names[i];
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
            new GLExtension(gl);
            new GLEnum(gl)
            new GLAdvanced(gl);
            new Renderer(gl);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
            return gl;
        }
    }
}