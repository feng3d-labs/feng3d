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

        private _geometryInvalid = true;

        private _scaleU: number = 1;
        private _scaleV: number = 1;

        /**
         * 坐标数据
         */
        public get positions()
        {
            this.updateGrometry();
            var positionData = this._attributes[GLAttribute.a_position];
            return positionData && positionData.data;
        }

        public set positions(value)
        {
            if (value)
            {
                var positionData = this._attributes[GLAttribute.a_position] = this._attributes[GLAttribute.a_position] || new AttributeRenderData(value, 3);;
                positionData.data = value;
            } else
            {
                delete this._attributes[GLAttribute.a_position];
            }
        }

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
            this.updateGrometry();
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
            this._geometryInvalid = true;
            this.invalidateRenderData();
        }

        /**
         * 更新几何体
         */
        protected updateGrometry()
        {
            if (this._geometryInvalid)
            {
                this.buildGeometry();
                this._geometryInvalid = false;
                this.invalidateBounds();
            }
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
         * 获取顶点数据
         */
        public getIndexData()
        {
            return this._indexBuffer;
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
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        public addGeometry(geometry: Geometry, transform: Matrix3D = null)
        {
            //更新几何体
            this.updateGrometry();
            geometry.updateGrometry();
            //变换被添加的几何体
            if (transform != null)
            {
                geometry = geometry.clone();
                geometry.applyTransformation(transform);
            }

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
		 * 应用变换矩阵
		 * @param transform 变换矩阵
		 */
        public applyTransformation(transform: Matrix3D)
        {
            this.updateGrometry();

            var positionRenderData = this.getVAData(GLAttribute.a_position);
            var normalRenderData = this.getVAData(GLAttribute.a_normal);
            var tangentRenderData = this.getVAData(GLAttribute.a_tangent);

            var vertices = positionRenderData.data;
            var normals = normalRenderData.data;
            var tangents = tangentRenderData.data;

            var posStride: number = positionRenderData.stride;
            var normalStride: number = normalRenderData.stride;
            var tangentStride: number = tangentRenderData.stride;

            var len: number = vertices.length / posStride;
            var i: number, i1: number, i2: number;
            var vector: Vector3D = new Vector3D();

            var bakeNormals: boolean = normals != null;
            var bakeTangents: boolean = tangents != null;
            var invTranspose: Matrix3D;

            if (bakeNormals || bakeTangents)
            {
                invTranspose = transform.clone();
                invTranspose.invert();
                invTranspose.transpose();
            }

            var vi0: number = 0;
            var ni0: number = 0;
            var ti0: number = 0;

            for (i = 0; i < len; ++i)
            {
                i1 = vi0 + 1;
                i2 = vi0 + 2;

                // bake position
                vector.x = vertices[vi0];
                vector.y = vertices[i1];
                vector.z = vertices[i2];
                vector = transform.transformVector(vector);
                vertices[vi0] = vector.x;
                vertices[i1] = vector.y;
                vertices[i2] = vector.z;
                vi0 += posStride;

                // bake normal
                if (bakeNormals)
                {
                    i1 = ni0 + 1;
                    i2 = ni0 + 2;
                    vector.x = normals[ni0];
                    vector.y = normals[i1];
                    vector.z = normals[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    normals[ni0] = vector.x;
                    normals[i1] = vector.y;
                    normals[i2] = vector.z;
                    ni0 += normalStride;
                }

                // bake tangent
                if (bakeTangents)
                {
                    i1 = ti0 + 1;
                    i2 = ti0 + 2;
                    vector.x = tangents[ti0];
                    vector.y = tangents[i1];
                    vector.z = tangents[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    tangents[ti0] = vector.x;
                    tangents[i1] = vector.y;
                    tangents[i2] = vector.z;
                    ti0 += tangentStride;
                }
            }

            positionRenderData.invalidate();
            normalRenderData.invalidate();
            normalRenderData.invalidate();
        }

        /**
         * 纹理U缩放，默认为1。
         */
        public get scaleU(): number
        {
            return this._scaleU;
        }

        /**
         * 纹理V缩放，默认为1。
         */
        public get scaleV(): number
        {
            return this._scaleV;
        }

        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        public scaleUV(scaleU: number = 1, scaleV: number = 1)
        {
            this.updateGrometry();

            var uvVaData = this.getVAData(GLAttribute.a_uv);
            var uvs = uvVaData.data;
            var len: number = uvs.length;
            var ratioU: number = scaleU / this._scaleU;
            var ratioV: number = scaleV / this._scaleV;

            for (var i: number = 0; i < len; i += 2)
            {
                uvs[i] *= ratioU;
                uvs[i + 1] *= ratioV;
            }

            this._scaleU = scaleU;
            this._scaleV = scaleV;

            uvVaData.invalidate();
        }

        /**
         * 包围盒失效
         */
        public invalidateBounds()
        {
            this.dispatchEvent(new GeometryEvent(GeometryEvent.BOUNDS_INVALID))
        }

        /**
         * 克隆一个几何体
         */
        public clone()
        {
            var geometry = new Geometry();
            geometry.cloneFrom(this);
            return geometry;
        }

        /**
         * 从一个几何体中克隆数据
         */
        public cloneFrom(geometry: Geometry)
        {
            geometry.updateGrometry();
            this._indexBuffer = geometry._indexBuffer.clone();
            this._attributes = {};
            for (var key in geometry._attributes)
            {
                this._attributes[key] = geometry._attributes[key].clone();
            }
        }
    }
}