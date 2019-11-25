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
    export class Geometry extends AssetData
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
         * 平面几何体
         */
        static quad: QuadGeometry;

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

        /**
         * 资源编号
         */
        assetId: string;

        assetType = AssetType.geometry;

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
            return this._indexBuffer.indices;
        }

		/**
		 * 更新顶点索引数据
		 */
        set indices(value: number[])
        {
            this._indexBuffer.indices = value;
        }

        /**
         * 坐标数据
         */
        get positions()
        {
            return this._attributes.a_position.data;
        }

        set positions(value)
        {
            this._attributes.a_position.data = value;
        }

        /**
         * uv数据
         */
        get uvs()
        {
            return this._attributes.a_uv.data;
        }

        set uvs(value)
        {
            this._attributes.a_uv.data = value;
        }

        /**
         * 法线数据
         */
        get normals()
        {
            return this._attributes.a_normal.data;
        }

        set normals(value)
        {
            this._attributes.a_normal.data = value;
        }

        /**
         * 切线数据
         */
        get tangents()
        {
            return this._attributes.a_tangent.data;
        }

        set tangents(value)
        {
            this._attributes.a_tangent.data = value;
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
            var key = <string>vaId;
            if (data)
            {
                this._attributes[key] = this._attributes[key] || new Attribute(vaId, data, size);
                this._attributes[key].data = data;
            } else
            {
                delete this._attributes[key];
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

            var attribute: Attribute = this._attributes[vaId];
            return attribute && attribute.data;
        }

        /**
         * 顶点数量
         */
        get numVertex()
        {
            return this.positions.length / 3;
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
            if (!this.indices)
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
            var indices = this.indices;
            var targetIndices = geometry.indices;
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
        @serialize
        @oav()
        scaleU = 1;

        /**
         * 纹理V缩放，默认为1。
         */
        @serialize
        @oav()
        scaleV = 1;

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
                    return new AABB();
                this._bounding = AABB.formPositions(this.positions);
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
         * 获取顶点列表
         * 
         * @param result 
         */
        getVertices(result: feng3d.Vector3[] = [])
        {
            var positions = this.positions;
            var result: feng3d.Vector3[] = []
            for (let i = 0, n = positions.length; i < n; i += 3)
            {
                result.push(new feng3d.Vector3(positions[i], positions[i + 1], positions[i + 2]));
            }

            return result;
        }

        getFaces(result: number[][] = [])
        {
            var indices = this.indices;
            for (let i = 0, n = indices.length; i < n; i += 3)
            {
                result.push([indices[i], indices[i + 1], indices[i + 2]]);
            }
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
            this._attributes = <any>{};
            for (var key in geometry._attributes)
            {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(<any>key, attributeRenderData.data, attributeRenderData.size);
            }
        }

        beforeRender(renderAtomic: RenderAtomic)
        {
            this.updateGrometry();

            renderAtomic.indexBuffer = this._indexBuffer;

            for (const key in this._attributes)
            {
                if (this._attributes.hasOwnProperty(key))
                {
                    renderAtomic.attributes[key] = this._attributes[key];
                }
            }

            renderAtomic.shaderMacro.SCALEU = this.scaleU;
            renderAtomic.shaderMacro.SCALEV = this.scaleV;
        }

        /**
         * 顶点索引缓冲
         */
        private _indexBuffer = new Index();

        /**
         * 属性数据列表
         */
        protected _attributes = {
            a_position: new Attribute("a_position", [], 3),
            a_uv: new Attribute("a_uv", [], 2),
            a_normal: new Attribute("a_normal", [], 3),
            a_tangent: new Attribute("a_tangent", [], 3),
        };

        private _geometryInvalid = true;
        private _useFaceWeights = false;

        private _bounding: AABB;
    }
}