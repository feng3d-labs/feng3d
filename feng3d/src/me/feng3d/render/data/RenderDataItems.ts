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

        /** 属性数据 */
        data: Float32Array;

        /** 属性数据长度 */
        size: number;
    }

	/**
     * 常量4*4矩阵渲染数据
     */
    export class UniformMatrix4fvRenderData {

        /**
         * 常量名称
         */
        name: string;

		/**
		 * 矩阵数据
		 */
        matrix: Matrix3D;
    }
}