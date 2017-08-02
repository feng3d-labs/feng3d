namespace feng3d
{
    export interface GeometryEventMap extends RenderDataHolderEventMap
    {
		/**
		 * 获取几何体顶点数据
		 */
        getVAData;

		/**
		 * 改变几何体顶点数据事件
		 */
        changedVAData;

		/**
		 * 改变顶点索引数据事件
		 */
        changedIndexData;

		/**
		 * 包围盒失效
		 */
        boundsInvalid;
    }

    export interface Geometry
    {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean);
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: GeometryEventMap[K]) => any, thisObject?: any);
    }

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export class Geometry extends Feng3dObject
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
        private _useFaceWeights = false;

        private _scaleU = 1;
        private _scaleV = 1;

        /**
         * 坐标数据
         */
        get positions()
        {
            return this.getVAData1("a_position")
        }

        set positions(value)
        {
            this.setVAData("a_position", value, 3);
        }

        /**
         * uv数据
         */
        get uvs()
        {
            return this.getVAData1("a_uv")
        }

        set uvs(value)
        {
            this.setVAData("a_uv", value, 2);
        }

        /**
         * 法线数据
         */
        get normals()
        {
            return this.getVAData1("a_normal");
        }
        set normals(value)
        {
            this.setVAData("a_normal", value, 3);
        }

        /**
         * 切线数据
         */
        get tangents()
        {
            return this.getVAData1("a_tangent");
        }
        set tangents(value)
        {
            this.setVAData("a_tangent", value, 3);
        }

        /**
		 * 创建一个几何体
		 */
        constructor()
        {
            super();
        }

        /**
		 * 更新渲染数据
		 */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            this.updateGrometry();
            super.updateRenderData(renderContext, renderData);
        }

        /**
         * 几何体变脏
         */
        protected invalidateGeometry()
        {
            this._geometryInvalid = true;
            this.invalidate();
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
         * 索引数据
         */
        get indices()
        {
            return this._indexBuffer && this._indexBuffer.indices;
        }

		/**
		 * 更新顶点索引数据
		 */
        setIndices(indices: Uint16Array)
        {
            this._indexBuffer = this.createIndexBuffer(indices);
            this.dispatch("changedIndexData");
        }

        /**
         * 获取顶点数据
         */
        getIndexData()
        {
            return this._indexBuffer;
        }

		/**
		 * 设置顶点属性数据
		 * @param vaId          顶点属性编号
		 * @param data          顶点属性数据
         * @param size          顶点数据尺寸
		 */
        setVAData<K extends keyof AttributeRenderDataStuct>(vaId: K, data: Float32Array, size: number)
        {
            if (data)
            {
                if (!this._attributes[vaId])
                    this._attributes[vaId] = this.createAttributeRenderData(vaId, data, size);
                this._attributes[vaId].data = data;
                this._attributes[vaId].updateGrometry = this.updateGrometry.bind(this);
            } else
            {
                delete this._attributes[vaId];
            }
            this.dispatch("changedVAData", vaId);
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        getVAData(vaId: string)
        {
            this.updateGrometry();
            this.dispatch("getVAData", vaId);
            return this._attributes[vaId];
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        getVAData1(vaId: string)
        {
            var attributeRenderData = this.getVAData(vaId);
            return attributeRenderData && attributeRenderData.data;
        }

        /**
         * 顶点数量
         */
        get numVertex()
        {
            var numVertex = 0;
            for (var attributeName in this._attributes)
            {
                var attributeRenderData = this._attributes[attributeName];
                numVertex = attributeRenderData.data.length / attributeRenderData.size;
                break;
            }
            return numVertex;
        }

        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, transform: Matrix3D = null)
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
                var stride = attributes[attributeName].size;
                var data = new Float32Array(totalVertex * stride);
                data.set(attributes[attributeName].data, 0);
                data.set(addAttributes[attributeName].data, oldNumVertex * stride);
                this.setVAData(<any>attributeName, data, stride);
            }
        }

        /**
		 * 应用变换矩阵
		 * @param transform 变换矩阵
		 */
        applyTransformation(transform: Matrix3D)
        {
            this.updateGrometry();

            var positionRenderData = this.getVAData("a_position");
            var normalRenderData = this.getVAData("a_normal");
            var tangentRenderData = this.getVAData("a_tangent");

            var vertices = positionRenderData.data;
            var normals = normalRenderData.data;
            var tangents = tangentRenderData.data;

            var posStride = positionRenderData.size;
            var normalStride = normalRenderData.size;
            var tangentStride = tangentRenderData.size;

            var len = vertices.length / posStride;
            var i: number, i1: number, i2: number;
            var vector: Vector3D = new Vector3D();

            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose: Matrix3D;

            if (bakeNormals || bakeTangents)
            {
                invTranspose = transform.clone();
                invTranspose.invert();
                invTranspose.transpose();
            }

            var vi0 = 0;
            var ni0 = 0;
            var ti0 = 0;

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
        get scaleU(): number
        {
            return this._scaleU;
        }

        /**
         * 纹理V缩放，默认为1。
         */
        get scaleV(): number
        {
            return this._scaleV;
        }

        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        scaleUV(scaleU = 1, scaleV = 1)
        {
            this.updateGrometry();

            var uvVaData = this.getVAData("a_uv");
            var uvs = uvVaData.data;
            var len = uvs.length;
            var ratioU = scaleU / this._scaleU;
            var ratioV = scaleV / this._scaleV;

            for (var i = 0; i < len; i += 2)
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
        invalidateBounds()
        {
            this.dispatch("boundsInvalid");
        }

        /**
         * 创建顶点法线
         */
        createVertexNormals()
        {
            //生成法线
            var normals = GeometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
            this.normals = new Float32Array(normals);
        }

        /**
         * 创建顶点切线
         */
        createVertexTangents()
        {
            //生成切线
            var tangents = GeometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
            this.tangents = new Float32Array(tangents);
        }

        /**
         * 克隆一个几何体
         */
        clone()
        {
            var geometry = new Geometry();
            geometry.cloneFrom(this);
            return geometry;
        }

        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry)
        {
            geometry.updateGrometry();
            this.setIndices(geometry.indices);
            this._attributes = {};
            for (var key in geometry._attributes)
            {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(<any>key, attributeRenderData.data, attributeRenderData.size);
            }
        }
    }
}