namespace feng3d
{
    export interface GeometryEventMap extends RenderDataHolderEventMap
    {
		/**
		 * 包围盒失效
		 */
        boundsInvalid: Geometry;
    }

    export interface Geometry
    {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean);
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export abstract class Geometry extends Feng3dObject
    {
        /**
         * 网格名称
         */
        name: string;

        /**
         * 顶点索引缓冲
         */
        protected _indices: number[];
        /**
         * 自动生成的顶点索引
         */
        protected _autoIndices: number[];
        /**
         * 属性数据列表
         */
        protected _attributes: { [name: string]: { data: number[], size: number } } = {};

        private _geometryInvalid = true;
        private _useFaceWeights = false;

        private _scaleU = 1;
        private _scaleV = 1;

        private _bounding: Box;

        private _autoAttributeDatas: { [name: string]: { data: number[], size: number } } = {};

        private _invalids = { index: true, a_uv: true, a_normal: true, a_tangent: true };

        /**
         * 索引数据
         */
        get indices()
        {
            this.updateGrometry();
            if (!this._indices && this._invalids.index)
            {
                this._invalids.index = false;
                this._autoIndices = GeometryUtils.createIndices(this.positions);
            }
            return this._indices || this._autoIndices;
        }

		/**
		 * 更新顶点索引数据
		 */
        set indices(value: number[])
        {
            this._indices = value;

            if (!this._attributes.a_normal)
                this._invalids.a_normal = true;
            if (!this._attributes.a_tangent)
                this._invalids.a_tangent = true;

            this.createIndexBuffer(() => this.indices);
        }

        /**
         * 坐标数据
         */
        get positions()
        {
            return this.getVAData1("a_position")
        }

        set positions(value)
        {
            if (!this._indices)
                this._invalids.index = true;
            this.setVAData("a_position", value, 3);

            if (!this._attributes.a_uv)
                this._invalids.a_uv = true;
            if (!this._attributes.a_normal)
                this._invalids.a_normal = true;
            if (!this._attributes.a_tangent)
                this._invalids.a_tangent = true;
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
            if (!this._attributes.a_tangent)
                this._invalids.a_tangent = true;
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
            this.createIndexBuffer(() => this.indices);
            this.createAttribute("a_position", 3);
            this.createAttribute("a_position", 3);
            this.createAttribute("a_uv", 2);
            this.createAttribute("a_normal", 2);
            this.createAttribute("a_tangent", 2);
        }

        private createAttribute<K extends keyof Attributes>(vaId: K, size: number)
        {
            this.createAttributeRenderData(vaId, () =>
            {
                return this.getVAData1(vaId);
            }, size);
            this.createBoolMacro(<any>("HSA_" + vaId), true);
        }

        /**
         * 几何体变脏
         */
        protected invalidateGeometry()
        {
            this._geometryInvalid = true;
            this.invalidateBounds();
        }

        /**
         * 更新几何体
         */
        updateGrometry()
        {
            if (this._geometryInvalid)
            {
                this._geometryInvalid = false;
                this.buildGeometry();
            }
        }

        /**
         * 构建几何体
         */
        protected buildGeometry()
        {
        }

		/**
		 * 设置顶点属性数据
		 * @param vaId                  顶点属性编号
		 * @param data                  顶点属性数据
         * @param size                  顶点数据尺寸
         * @param autogenerate          是否自动生成数据
		 */
        setVAData<K extends keyof Attributes>(vaId: K, data: number[], size: number)
        {
            if (data)
            {
                this._attributes[vaId] = this._attributes[vaId] || { data: data, size: size };
                this._attributes[vaId].data = data;
                this.createAttribute(vaId, size);
            } else
            {
                delete this._attributes[vaId];
            }
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        getVAData1(vaId: string)
        {
            this.updateGrometry();

            if (vaId == "a_uv")
            {
                if (!this._attributes.a_uv && this._invalids.a_uv)
                {
                    this._invalids.a_uv = false;
                    var uvs = GeometryUtils.createUVs(this.positions);
                    this._autoAttributeDatas[vaId] = { data: uvs, size: 2 };
                }
            }

            if (vaId == "a_normal")
            {
                if (!this._attributes.a_normal && this._invalids.a_normal)
                {
                    this._invalids.a_normal = false;
                    var normals = GeometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
                    this._autoAttributeDatas[vaId] = { data: normals, size: 3 };
                }
            }

            if (vaId == "a_tangent")
            {
                if (!this._attributes.a_tangent && this._invalids.a_tangent)
                {
                    this._invalids.a_tangent = false;
                    var tangents = GeometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
                    this._autoAttributeDatas[vaId] = { data: tangents, size: 3 };
                }
            }

            var attributeRenderData = this._attributes[vaId] || this._autoAttributeDatas[vaId];
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
        addGeometry(geometry: Geometry, transform?: Matrix4x4)
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
            if (!this._indices)
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
            var indices = this._indices;
            var targetIndices = geometry._indices;
            var totalIndices = indices.concat();
            for (var i = 0; i < targetIndices.length; i++)
            {
                totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
            }
            this.indices = totalIndices;
            //合并后顶点数量
            var totalVertex = oldNumVertex + geometry.numVertex;
            //合并属性数据
            for (var attributeName in attributes)
            {
                var stride = attributes[attributeName].size;
                var attributeData = attributes[attributeName].data;
                var addAttributeData = addAttributes[attributeName].data;
                var data = attributeData.concat(addAttributeData);
                this.setVAData(<any>attributeName, data, stride);
            }
        }

        /**
		 * 应用变换矩阵
		 * @param transform 变换矩阵
		 */
        applyTransformation(transform: Matrix4x4)
        {
            this.updateGrometry();

            var vertices = this.positions;
            var normals = this.normals;
            var tangents = this.tangents;

            var posStride = 3;
            var normalStride = 3;
            var tangentStride = 3;

            var len = vertices.length / posStride;
            var i: number, i1: number, i2: number;
            var vector: Vector3 = new Vector3();

            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose = new Matrix4x4();

            if (bakeNormals || bakeTangents)
            {
                invTranspose.copyFrom(transform);
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

            this.positions = vertices;
            this.normals = normals;
            this.tangents = tangents;
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

            var uvs = this.uvs;
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

            this.uvs = uvs;
        }

        /**
         * 包围盒失效
         */
        invalidateBounds()
        {
            this._bounding = <any>null;
            this.dispatch("boundsInvalid", this);
        }

        get bounding()
        {
            this.updateGrometry();
            if (!this._bounding)
            {
                var positions = this.positions;
                if (!positions || positions.length == 0)
                    return null;
                this._bounding = Box.formPositions(this.positions);
            }
            return this._bounding;
        }

        /**
         * 克隆一个几何体
         */
        clone()
        {
            var geometry = new CustomGeometry();
            geometry.cloneFrom(this);
            return geometry;
        }

        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry)
        {
            geometry.updateGrometry();
            this.indices = geometry.indices.concat();
            this._attributes = {};
            for (var key in geometry._attributes)
            {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(<any>key, attributeRenderData.data, attributeRenderData.size);
            }
        }
    }
}