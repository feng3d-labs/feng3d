module feng3d {

	/**
	 * 索引渲染数据
     * @author feng 2017-01-04
	 */
    export class IndexRenderData {

        /**
         * 索引数据
         */
        indices: Uint16Array;

        /**
         * 数据绑定目标，gl.ARRAY_BUFFER、gl.ELEMENT_ARRAY_BUFFER
         */
        target: number = WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER;

        /**
         * 渲染数量
         */
        count: number;

        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: number = WebGL2RenderingContext.UNSIGNED_SHORT;

        /**
         * 索引偏移
         */
        offset: number = 0;
    }

	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
	 */
    export class AttributeRenderData {

        /**
         * 属性数据
         */
        data: Float32Array;

        /**
         * 数据步长
         */
        stride: number;

        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         */
        divisor: number;

        constructor(data: Float32Array, stride: number, divisor: number = 0) {

            this.data = data;
            this.stride = stride;
            this.divisor = divisor;
        }
    }
}