module feng3d
{

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export class Geometry extends RenderDataHolder
    {
        /**
         * 顶点索引缓冲
         */
        private _indexBuffer: IndexRenderData;
        /**
         * 属性数据列表
         */
        private _attributes: { [name: string]: AttributeRenderData } = {};

        private _geometryInvalidate = true;

        /**
		 * 创建一个几何体
		 */
        constructor()
        {
            super();
            this._single = true;
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this._geometryInvalidate)
            {
                this.buildGeometry();
                this._geometryInvalidate = false;
            }
            renderData.indexBuffer = this._indexBuffer;
            for (var attributeName in this._attributes)
            {
                renderData.attributes[attributeName] = this._attributes[attributeName];
            }
            super.updateRenderData(renderContext, renderData);
        }

        /**
         * 几何体变脏
         */
        protected invalidateGeometry()
        {
            this._geometryInvalidate = true;
            this.invalidateRenderData();
        }

        /**
         * 构建几何体
         */
        protected buildGeometry()
        {
        }

		/**
		 * 更新顶点索引数据
		 */
        public setIndices(indices: Uint16Array)
        {
            this._indexBuffer = new IndexRenderData();
            this._indexBuffer.indices = indices;
            this._indexBuffer.count = indices.length;
            this.invalidateRenderData();
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_INDEX_DATA));
        }

		/**
		 * 设置顶点属性数据
		 * @param vaId          顶点属性编号
		 * @param data          顶点属性数据
         * @param stride        顶点数据步长
		 */
        public setVAData(vaId: string, data: Float32Array, stride: number)
        {
            this._attributes[vaId] = new AttributeRenderData(data, stride);
            this.invalidateRenderData();
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_VA_DATA, vaId));
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        public getVAData(vaId: string): AttributeRenderData
        {
            this.dispatchEvent(new GeometryEvent(GeometryEvent.GET_VA_DATA, vaId));
            return this._attributes[vaId];
        }

        /**
         * 顶点数量
         */
        public get numVertex()
        {
            var numVertex = 0;
            for (var attributeName in this._attributes)
            {
                var attributeRenderData = this._attributes[attributeName];
                numVertex = attributeRenderData.data.length / attributeRenderData.stride;
                break;
            }
            return numVertex;
        }

        /**
         * 附加几何体
         */
        public addGeometry(geometry: Geometry)
        {
            this.buildGeometry();
            geometry.buildGeometry();

            //如果自身为空几何体
            if (!this._indexBuffer)
            {
                this.cloneFrom(geometry);
                return;
            }

            //
            var attributes = this._attributes;
            var addAttributes = geometry._attributes;
            //当前顶点数量
            var oldNumVertex = this.numVertex;
            //合并索引
            var indices = this._indexBuffer.indices;
            var targetIndices = geometry._indexBuffer.indices;
            var totalIndices = new Uint16Array(indices.length + targetIndices.length);
            totalIndices.set(indices, 0);
            for (var i = 0; i < targetIndices.length; i++)
            {
                totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
            }
            this.setIndices(totalIndices);
            //合并后顶点数量
            var totalVertex = oldNumVertex + geometry.numVertex;
            //合并属性数据
            for (var attributeName in attributes)
            {
                var stride = attributes[attributeName].stride;
                var data = new Float32Array(totalVertex * stride);
                data.set(attributes[attributeName].data, 0);
                data.set(addAttributes[attributeName].data, oldNumVertex * stride);
                this.setVAData(attributeName, data, stride);
            }
        }

        /**
         * 克隆一个几何体
         */
        public clone()
        {
            var cls = <any>this.constructor;
            var geometry = new cls();
            geometry.cloneFrom(this);
            return geometry;
        }

        /**
         * 从一个几何体中克隆数据
         */
        public cloneFrom(geometry: Geometry)
        {
            this._indexBuffer = ObjectUtils.deepClone(geometry._indexBuffer);
            this._attributes = ObjectUtils.deepClone(geometry._attributes);
        }
    }
}