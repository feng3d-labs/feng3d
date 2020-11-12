namespace feng3d
{

    /**
     * 扩展（封装，包装）WebGL
     */
    export interface GL extends WebGLRenderingContext
    {
        /**
         * The WebGL2RenderingContext.vertexAttribDivisor() method of the WebGL 2 API modifies the rate at which generic vertex attributes advance when rendering multiple instances of primitives with gl.drawArraysInstanced() and gl.drawElementsInstanced().
         * 
         * WebGL2 API的WebGL2RenderingContext.vertexAttribDivisor()方法在使用gl. drawarraysinstated()和gl. drawelementsinstated()呈现多个原语实例时，修改了通用顶点属性的提升速度。
         * 
         * @param index A GLuint specifying the index of the generic vertex attributes. 指定一般顶点属性的索引的GLuint。
         * @param divisor 指定将在通用属性的更新之间传递的实例数的GLuint。
         * 
         * @see WebGL2RenderingContextBase.vertexAttribDivisor
         * @see ANGLE_instanced_arrays.vertexAttribDivisorANGLE
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
         */
        vertexAttribDivisor(index: GLuint, divisor: GLuint): void;

        /**
         * The WebGL2RenderingContext.drawElementsInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawElements() method. In addition, it can execute multiple instances of a set of elements.
         * 
         * WebGL2 API的webgl2renderingcontext . drawelementsinstance()方法呈现来自数组数据的原语，如gl.drawElements()方法。此外，它可以执行一组元素的多个实例。
         * 
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param count A GLsizei specifying the number of elements to be rendered. 指定要呈现的元素数量的GLsizei。
         * @param type A GLenum specifying the type of the values in the element array buffer. 指定元素数组缓冲区中值的类型的GLenum。 
         * @param offset A GLintptr specifying an offset in the element array buffer. Must be a valid multiple of the size of the given type. 指定元素数组缓冲区中的偏移量的GLintptr。必须是给定类型大小的有效倍数。
         * @param instanceCount A GLsizei specifying the number of instances of the set of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         * 
         * @see WebGL2RenderingContextBase.drawElementsInstanced
         */
        drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void;

        /**
         * The WebGL2RenderingContext.drawArraysInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawArrays() method. In addition, it can execute multiple instances of the range of elements.
         * 
         * WebGL2 API的webgl2renderingcontext . drawarraysinstance()方法呈现来自数组数据的原语，比如gl.drawArrays()方法。此外，它可以执行元素范围的多个实例。
         * 
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param first A GLint specifying the starting index in the array of vector points. 在向量点数组中指定起始索引的位置。
         * @param count A GLsizei specifying the number of indices to be rendered. 指定要呈现的索引数量的GLsizei。
         * @param instanceCount A GLsizei specifying the number of instances of the range of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         */
        drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void;

        /**
         * 设置纹理最大向异性。 (相当于texParameterf(textureType, ext.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);)
         * 
         * @param target A GLenum specifying the binding point (target).  GLenum 指定绑定点(目标)
         * @param param Maximum anisotropy for a texture. 纹理最大向异性值
         * 
         * @see WebGLRenderingContextBase.texParameterf
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/texParameter
         */
        texParameterfAnisotropy(target: GLenum, anisotropy: GLfloat): void;

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
         * 渲染
         * 
         * @param renderAtomic 渲染数据
         */
        render(renderAtomic: RenderAtomic): void;

        /**
         * WEBGL 支持能力
         */
        capabilities: GLCapabilities;

        /**
         * 缓存
         */
        cache: GLCache;
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
            var contextIds = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
            // var contextIds = ["webgl"];
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
            new GLCache(gl);
            new GLExtension(gl);
            new GLCapabilities(gl);
            new WebGLRenderer(gl);
            //
            gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
            this.glList.push(gl);
            return gl;
        }
    }
}