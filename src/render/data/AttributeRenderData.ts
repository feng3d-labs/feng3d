module feng3d
{
	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
	 */
    export class AttributeRenderData
    {
        /**
         * 属性数据
         */
        public data: Float32Array;

        /**
         * 数据步长
         */
        public stride = 3;

        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         */
        public divisor = 0;

        constructor(data: Float32Array = null, stride: number = 3, divisor: number = 0)
        {
            this.data = data;
            this.stride = stride;
            this.divisor = divisor;
        }
    }
}