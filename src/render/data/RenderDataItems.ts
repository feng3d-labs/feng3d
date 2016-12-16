module feng3d {

    /**
     * 渲染程序
     */
    export class ShaderData {

        private shaderName: string;

        /**
         * 顶点渲染程序代码
         */
        public vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        public get isOk() {

            this.vertexCode = this.vertexCode || ShaderLib.getShaderCode(this.shaderName + ".vertex.glsl");
            this.fragmentCode = this.fragmentCode || ShaderLib.getShaderCode(this.shaderName + ".fragment.glsl");

            return this.vertexCode != null && this.fragmentCode != null;
        }

        constructor(shaderName: string) {
            this.shaderName = shaderName;
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
}