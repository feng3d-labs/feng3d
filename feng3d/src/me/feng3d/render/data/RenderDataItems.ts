module me.feng3d {

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
    }

	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
	 */
    export class AttributeRenderData {

        /**
         * 属性名称
         */
        name: string;

        /**
         * 属性数据
         */
        data: Float32Array;

        /**
         * 属性数据长度
         */
        size: number;
    }

	/**
     * 常量渲染数据
     */
    export class UniformRenderData {

        /**
         * 常量名称
         */
        name: string;

		/**
		 * 数据
		 */
        data: Matrix3D | Vec4;
    }

    /**
     * 渲染常量向量类型
     */
    export interface Vec4 {
        x: number, y: number, z: number, w: number;
    }
}