namespace feng3d
{
    export interface GeometryTypes { }

    export type GeometryLike = GeometryTypes[keyof GeometryTypes];

    export interface GeometryEventMap
    {
        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;
    }

    /**
     * 几何体
     */
    export class Geometry<T extends GeometryEventMap = GeometryEventMap> extends Feng3dObject<T>
    {
        @oav({ component: "OAVFeng3dPreView" })
        private preview = "";

        @oav()
        name: string = "Geometry";

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
         * 颜色数据
         */
        get colors()
        {
            return this._attributes.a_color.data;
        }

        set colors(value)
        {
            this._attributes.a_color.data = value;
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
         * 蒙皮索引，顶点关联的关节索引
         */
        get skinIndices()
        {
            return this._attributes.a_skinIndices.data;
        }

        set skinIndices(value)
        {
            this._attributes.a_skinIndices.data = value;
        }

        /**
         * 蒙皮权重，顶点关联的关节权重
         */
        get skinWeights()
        {
            return this._attributes.a_skinWeights.data;
        }

        set skinWeights(value)
        {
            this._attributes.a_skinWeights.data = value;
        }

        /**
         * 蒙皮索引，顶点关联的关节索引
         */
        get skinIndices1()
        {
            return this._attributes.a_skinIndices1.data;
        }

        set skinIndices1(value)
        {
            this._attributes.a_skinIndices1.data = value;
        }

        /**
         * 蒙皮权重，顶点关联的关节权重
         */
        get skinWeights1()
        {
            return this._attributes.a_skinWeights1.data;
        }

        set skinWeights1(value)
        {
            this._attributes.a_skinWeights1.data = value;
        }

        /**
         * 创建一个几何体
         */
        constructor()
        {
            super();
        }

        /**
         * 标记需要更新几何体，在更改几何体数据后需要调用该函数。
         */
        @oav({ tooltip: "标记需要更新几何体，在更改几何体数据后需要调用该函数。" })
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
         * @param matrix         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, matrix?: Matrix4x4)
        {
            //更新几何体
            this.updateGrometry();
            geometry.updateGrometry();
            //变换被添加的几何体
            if (matrix != null)
            {
                geometry = geometry.clone();
                geometry.applyTransformation(matrix);
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
                var attribute: Attribute = attributes[attributeName];
                var addAttribute: Attribute = addAttributes[attributeName];
                //
                attribute.data = attribute.data.concat(addAttribute.data);
            }
        }

        /**
         * 应用变换矩阵
         * @param matrix 变换矩阵
         */
        applyTransformation(matrix: Matrix4x4)
        {
            this.updateGrometry();

            var vertices = this.positions;
            var normals = this.normals;
            var tangents = this.tangents;

            geometryUtils.applyTransformation(matrix, vertices, normals, tangents);

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
            this.emit("boundsInvalid", this);
        }

        get bounding()
        {
            this.updateGrometry();
            if (!this._bounding)
            {
                var positions = this.positions;
                if (!positions || positions.length == 0)
                    return new Box3();
                this._bounding = Box3.formPositions(this.positions);
            }
            return this._bounding;
        }

        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param cullFace                      裁剪面枚举
         */
        raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE)
        {
            var result = geometryUtils.raycast(ray, this.indices, this.positions, this.uvs, shortestCollisionDistance, cullFace);
            return result;
        }

        /**
         * 获取顶点列表
         * 
         * @param result 
         */
        getVertices(result: Vector3[] = [])
        {
            var positions = this.positions;
            var result: Vector3[] = []
            for (let i = 0, n = positions.length; i < n; i += 3)
            {
                result.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
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
            for (var attributeName in geometry._attributes)
            {
                var attribute: Attribute = this._attributes[attributeName];
                var addAttribute: Attribute = geometry._attributes[attributeName];

                attribute.data = addAttribute.data.concat();
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
        protected _attributes: Attributes = {
            a_position: new Attribute("a_position", [], 3),
            a_color: new Attribute("a_color", [], 4),
            a_uv: new Attribute("a_uv", [], 2),
            a_normal: new Attribute("a_normal", [], 3),
            a_tangent: new Attribute("a_tangent", [], 3),
            a_skinIndices: new Attribute("a_skinIndices", [], 4),
            a_skinWeights: new Attribute("a_skinWeights", [], 4),
            a_skinIndices1: new Attribute("a_skinIndices1", [], 4),
            a_skinWeights1: new Attribute("a_skinWeights1", [], 4),
        };

        /**
         * 清理数据
         */
        clear()
        {
            for (const key in this._attributes)
            {
                const element: Attribute = this._attributes[key];
                element.data = [];
            }
        }

        private _geometryInvalid = true;
        private _useFaceWeights = false;

        private _bounding: Box3;

        /**
         * 设置默认几何体
         * 
         * @param name 默认几何体名称
         * @param geometry 默认几何体
         */
        static setDefault<K extends keyof DefaultGeometry>(name: K, geometry: DefaultGeometry[K], param?: gPartial<DefaultGeometry[K]>)
        {
            this._defaultGeometry[name] = geometry;
            if (param) serialization.setValue(geometry, param);
            serialization.setValue(geometry, { name: name, assetId: name, hideFlags: HideFlags.NotEditable });
            AssetData.addAssetData(name, geometry);
        }

        /**
         * 获取默认几何体
         * 
         * @param name 默认几何体名称
         */
        static getDefault<K extends keyof DefaultGeometry>(name: K)
        {
            return this._defaultGeometry[name];
        }
        private static _defaultGeometry: DefaultGeometry = <any>{};
    }

    /**
     * 默认几何体
     */
    export interface DefaultGeometry
    {
    }
}