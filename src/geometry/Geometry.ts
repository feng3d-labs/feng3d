namespace feng3d
{
    export interface GeometryMap { }

    export type Geometrys = GeometryMap[keyof GeometryMap];

    export interface GeometryEventMap
    {
		/**
		 * 包围盒失效
		 */
        boundsInvalid: Geometry;
    }

    export interface Geometry
    {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean): Event<GeometryEventMap[K]>;
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 几何体
     */
    export class Geometry extends Feng3dAssets
    {

        /**
         * 立（长）方体几何体
         */
        static cube: CubeGeometry;

        /**
         * 胶囊体几何体
         */
        static capsule: CapsuleGeometry;

        /**
         * 圆锥体
         */
        static cone: ConeGeometry;

        /**
         * 圆柱体几何体
         */
        static cylinder: CylinderGeometry;

        /**
         * 平面几何体
         */
        static plane: PlaneGeometry;

        /**
         * 球体几何体
         */
        static sphere: SphereGeometry;

        /**
         * 圆环几何体
         */
        static torus: TorusGeometry;

        /**
         * 点几何体
         */
        static point: PointGeometry

        /**
         * 默认地形几何体
         */
        static terrain: TerrainGeometry;

        /**
         * 公告牌
         */
        static billboard: PlaneGeometry;

        @oav({ component: "OAVFeng3dPreView" })
        private preview = "";

        @oav()
        name: string;

        assetType = AssetExtension.geometry;

        /**
         * 几何体信息
         */
        @oav({ component: "OAVMultiText", priority: 10 })
        get geometryInfo()
        {
            var str = [
                `Geometry Info`,
                `  Vertices    ${this.numVertex}`,
                `  Triangles    ${this.numTriangles}`,
                `  Attributes    ${Object.keys(this._attributes).join(",")}`,
            ].join("\n");
            return str;
        }

        /**
         * 索引数据
         */
        get indices()
        {
            this.updateGrometry();
            if (!this._indices && this._invalids.index)
            {
                this._invalids.index = false;
                this._autoIndices = geometryUtils.createIndices(this.positions);
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
        }

        /**
         * 几何体变脏
         */
        invalidateGeometry()
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
                    var uvs = geometryUtils.createUVs(this.positions);
                    this._autoAttributeDatas[vaId] = { data: uvs, size: 2 };
                }
            }

            if (vaId == "a_normal")
            {
                if (!this._attributes.a_normal && this._invalids.a_normal)
                {
                    this._invalids.a_normal = false;
                    var normals = geometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
                    this._autoAttributeDatas[vaId] = { data: normals, size: 3 };
                }
            }

            if (vaId == "a_tangent")
            {
                if (!this._attributes.a_tangent && this._invalids.a_tangent)
                {
                    this._invalids.a_tangent = false;
                    var tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
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
         * 三角形数量
         */
        get numTriangles()
        {
            return this.indices.length / 3;
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

            geometryUtils.applyTransformation(transform, vertices, normals, tangents);

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

            var uvs = this.uvs.concat();
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
                    return new Box();
                this._bounding = Box.formPositions(this.positions);
            }
            return this._bounding;
        }

        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param cullFace                      裁剪面枚举
         */
        raycast(ray: Ray3D, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE)
        {
            var result = geometryUtils.raycast(ray, this.indices, this.positions, this.uvs, shortestCollisionDistance, cullFace);
            return result;
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

        beforeRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.indexBuffer = renderAtomic.indexBuffer || new Index();
            renderAtomic.indexBuffer.indices = this.indices;

            var attributes = renderAtomic.attributes;

            this.uvs;
            this.normals;
            this.tangents;

            for (const vaId in this._autoAttributeDatas)
            {
                if (this._autoAttributeDatas.hasOwnProperty(vaId))
                {
                    const element = this._autoAttributeDatas[vaId];
                    //
                    var attributeRenderData = attributes[vaId] = attributes[vaId] || new Attribute(vaId, element.data);
                    if (attributeRenderData.data != element.data)
                        attributeRenderData.data = element.data;
                    attributeRenderData.size = element.size;
                    attributeRenderData.divisor = 0;
                    //
                    renderAtomic.shaderMacro["HSA_" + vaId] = true;
                }
            }

            for (const vaId in this._attributes)
            {
                if (this._attributes.hasOwnProperty(vaId))
                {
                    const element = this._attributes[vaId];
                    //
                    var attributeRenderData = attributes[vaId] = attributes[vaId] || new Attribute(vaId, element.data);
                    if (attributeRenderData.data != element.data)
                        attributeRenderData.data = element.data;
                    attributeRenderData.size = element.size;
                    attributeRenderData.divisor = 0;
                    //
                    renderAtomic.shaderMacro["HSA_" + vaId] = true;
                }
            }
        }

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
    }
}