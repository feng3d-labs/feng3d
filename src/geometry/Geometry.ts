module feng3d {

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export class Geometry extends RenderDataHolder {

        /**
		 * 创建一个几何体
		 */
        constructor() {
            super();
        }

		/**
		 * 更新顶点索引数据
		 */
        public setIndices(indices: Uint16Array) {

            this.indexBuffer = new IndexRenderData();
            this.indexBuffer.indices = indices;
            this.indexBuffer.count = indices.length;
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_INDEX_DATA));
        }

		/**
		 * 设置顶点属性数据
		 * @param vaId          顶点属性编号
		 * @param data          顶点属性数据
         * @param stride        顶点数据步长
		 */
        public setVAData(vaId: string, data: Float32Array, stride: number) {

            this.attributes[vaId] = { data: data, stride: stride };
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_VA_DATA, vaId));
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        public getVAData(vaId: string): AttributeRenderData {

            this.dispatchEvent(new GeometryEvent(GeometryEvent.GET_VA_DATA, vaId));
            return this.attributes[vaId];
        }
    }
}