module feng3d {

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export class Geometry extends RenderDataHolder {

        /**
         * 索引数据
         */
        public indexBuffer: IndexRenderData;
        /**
         * 顶点数据
         */
        public attributes: { [name: string]: AttributeRenderData } = {};

        /**
		 * 创建一个几何体
		 */
        constructor() {
            super();
        }

		/**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            renderData.indexBuffer = this.indexBuffer;
            //
            var attributesNames = Object.keys(this.attributes);
            attributesNames.forEach(element => {
                renderData.attributes[element] = this.attributes[element];
            });
            //
            super.activate(renderData, camera);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.indexBuffer = null;
            //
            var attributesNames = Object.keys(this.attributes);
            attributesNames.forEach(element => {
                delete renderData.attributes[element];
            });
            super.deactivate(renderData);
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