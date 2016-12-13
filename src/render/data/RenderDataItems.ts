module feng3d {

	/**
     * 渲染程序数据
     * @author feng 2016-05-09
     */
    export class ProgramRenderData {

        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;

        /**
        * 获取程序常量列表
        */
        getUniforms() {

            var vertexUniforms: { [name: string]: { type: string } } = ShaderCodeUtils.getUniforms(this.vertexCode);
            var fragmentUniforms: { [name: string]: { type: string } } = ShaderCodeUtils.getUniforms(this.fragmentCode);
            var uniforms = vertexUniforms;

            for (var name in fragmentUniforms) {
                if (fragmentUniforms.hasOwnProperty(name)) {
                    var element = fragmentUniforms[name];
                    uniforms[name] = element;
                }
            }
            return uniforms;
        }
    }

	/**
	 * 索引渲染数据
	 */
    export class IndexRenderData {

        /**
         * 索引数据
         */
        indices: Uint16Array;

        /**
         * 数据绑定目标，gl.ARRAY_BUFFER、gl.ELEMENT_ARRAY_BUFFER
         */
        target: number = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;

        /**
         * 渲染数量
         */
        count: number;

        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: number = WebGLRenderingContext.UNSIGNED_SHORT;

        /**
         * 索引偏移
         */
        offset: number = 0;
    }

	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
	 */
    export interface AttributeRenderData {

        /**
         * 属性数据
         */
        data: Float32Array;

        /**
         * 数据步长
         */
        stride: number;
    }

    /**
     * 渲染常量向量类型
     */
    export interface Vec4 {
        x: number, y: number, z: number, w: number;
    }
}