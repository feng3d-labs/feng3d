namespace feng3d
{

    export type Geometrys =
        gPartial<SegmentGeometry> & { __class__: "feng3d.SegmentGeometry" }
        | gPartial<PlaneGeometry>
        | gPartial<CubeGeometry>
        | gPartial<SphereGeometry>
        | gPartial<CapsuleGeometry>
        | gPartial<CylinderGeometry>
        | gPartial<ConeGeometry>
        | gPartial<TorusGeometry>
        ;

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
        @oav()
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
                    return null;
                this._bounding = Box.formPositions(this.positions);
            }
            return this._bounding;
        }

        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param bothSides                     是否检测双面
         */
        raycast(ray: Ray3D, shortestCollisionDistance = 0, bothSides = true)
        {
            var indices = this.indices;
            var positions = this.positions;
            var uvs = this.uvs;

            var t = 0;
            var i0 = 0, i1 = 0, i2 = 0;
            var rx = 0, ry = 0, rz = 0;
            var nx = 0, ny = 0, nz = 0;
            var cx = 0, cy = 0, cz = 0;
            var coeff = 0, u = 0, v = 0, w = 0;
            var p0x = 0, p0y = 0, p0z = 0;
            var p1x = 0, p1y = 0, p1z = 0;
            var p2x = 0, p2y = 0, p2z = 0;
            var s0x = 0, s0y = 0, s0z = 0;
            var s1x = 0, s1y = 0, s1z = 0;
            var nl = 0, nDotV = 0, D = 0, disToPlane = 0;
            var Q1Q2 = 0, Q1Q1 = 0, Q2Q2 = 0, RQ1 = 0, RQ2 = 0;

            var collisionTriangleIndex = -1;

            var numIndices = indices.length;

            var result: { rayEntryDistance: number, localPosition: Vector3, localNormal: Vector3, uv: Vector2, index: number } = <any>{};

            //遍历每个三角形 检测碰撞
            for (var index = 0; index < numIndices; index += 3)
            { // sweep all triangles
                //三角形三个顶点索引
                i0 = indices[index] * 3;
                i1 = indices[index + 1] * 3;
                i2 = indices[index + 2] * 3;

                //三角形三个顶点数据
                p0x = positions[i0];
                p0y = positions[i0 + 1];
                p0z = positions[i0 + 2];
                p1x = positions[i1];
                p1y = positions[i1 + 1];
                p1z = positions[i1 + 2];
                p2x = positions[i2];
                p2y = positions[i2 + 1];
                p2z = positions[i2 + 2];

                //计算出三角面的法线
                s0x = p1x - p0x; // s0 = p1 - p0
                s0y = p1y - p0y;
                s0z = p1z - p0z;
                s1x = p2x - p0x; // s1 = p2 - p0
                s1y = p2y - p0y;
                s1z = p2z - p0z;
                nx = s0y * s1z - s0z * s1y; // n = s0 x s1
                ny = s0z * s1x - s0x * s1z;
                nz = s0x * s1y - s0y * s1x;
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); // normalize n
                nx *= nl;
                ny *= nl;
                nz *= nl;

                //初始化射线数据
                var rayPosition: Vector3 = ray.position;
                var rayDirection: Vector3 = ray.direction;

                //计算射线与法线的点积，不等于零表示射线所在直线与三角面相交
                nDotV = nx * rayDirection.x + ny * +rayDirection.y + nz * rayDirection.z; // rayDirection . normal
                //判断射线是否与三角面相交
                if ((!bothSides && nDotV < 0.0) || (bothSides && nDotV != 0.0))
                { // an intersection must exist
                    //计算平面方程D值，参考Plane3D
                    D = -(nx * p0x + ny * p0y + nz * p0z);
                    //射线点到平面的距离
                    disToPlane = -(nx * rayPosition.x + ny * rayPosition.y + nz * rayPosition.z + D);
                    t = disToPlane / nDotV;
                    //得到交点
                    cx = rayPosition.x + t * rayDirection.x;
                    cy = rayPosition.y + t * rayDirection.y;
                    cz = rayPosition.z + t * rayDirection.z;
                    //判断交点是否在三角形内( using barycentric coordinates )
                    Q1Q2 = s0x * s1x + s0y * s1y + s0z * s1z;
                    Q1Q1 = s0x * s0x + s0y * s0y + s0z * s0z;
                    Q2Q2 = s1x * s1x + s1y * s1y + s1z * s1z;
                    rx = cx - p0x;
                    ry = cy - p0y;
                    rz = cz - p0z;
                    RQ1 = rx * s0x + ry * s0y + rz * s0z;
                    RQ2 = rx * s1x + ry * s1y + rz * s1z;
                    coeff = 1 / (Q1Q1 * Q2Q2 - Q1Q2 * Q1Q2);
                    v = coeff * (Q2Q2 * RQ1 - Q1Q2 * RQ2);
                    w = coeff * (-Q1Q2 * RQ1 + Q1Q1 * RQ2);
                    if (v < 0)
                        continue;
                    if (w < 0)
                        continue;
                    u = 1 - v - w;
                    //u v w都大于0表示点在三角形内 射线的坐标t大于0表示射线朝向三角面
                    if (!(u < 0) && t > 0 && t < shortestCollisionDistance)
                    {
                        shortestCollisionDistance = t;
                        collisionTriangleIndex = index / 3;
                        result.rayEntryDistance = t;
                        result.localPosition = new Vector3(cx, cy, cz);
                        result.localNormal = new Vector3(nx, ny, nz);
                        if (uvs)
                        {
                            result.uv = getCollisionUV(indices, uvs, index, v, w, u);
                        }
                        result.localNormal = getCollisionNormal(indices, positions, index);
                        result.index = index;
                    }
                }
            }

            if (collisionTriangleIndex >= 0)
                return result;

            return null;


            /**
             * 获取碰撞法线
             * @param indices 顶点索引数据
             * @param positions 顶点数据
             * @param triangleIndex 三角形索引
             * @return 碰撞法线
             */
            function getCollisionNormal(indices: number[], positions: number[], triangleIndex = 0): Vector3
            {
                var i0 = indices[triangleIndex] * 3;
                var i1 = indices[triangleIndex + 1] * 3;
                var i2 = indices[triangleIndex + 2] * 3;

                var side0x = positions[i1] - positions[i0];
                var side0y = positions[i1 + 1] - positions[i0 + 1];
                var side0z = positions[i1 + 2] - positions[i0 + 2];
                var side1x = positions[i2] - positions[i0];
                var side1y = positions[i2 + 1] - positions[i0 + 1];
                var side1z = positions[i2 + 2] - positions[i0 + 2];

                var normal = new Vector3();
                normal.x = side0y * side1z - side0z * side1y;
                normal.y = side0z * side1x - side0x * side1z;
                normal.z = side0x * side1y - side0y * side1x;
                normal.normalize();
                return normal;
            }

            /**
             * 获取碰撞uv
             * @param indices 顶点数据
             * @param uvs uv数据
             * @param triangleIndex 三角形所有
             * @param v
             * @param w
             * @param u
             * @param uvOffset
             * @param uvStride
             * @return 碰撞uv
             */
            function getCollisionUV(indices: number[], uvs: number[], triangleIndex: number, v: number, w: number, u: number): Vector2
            {
                var uIndex = indices[triangleIndex] * 2;
                var uv0x = uvs[uIndex];
                var uv0y = uvs[uIndex + 1];
                uIndex = indices[triangleIndex + 1] * 2;
                var uv1x = uvs[uIndex];
                var uv1y = uvs[uIndex + 1];
                uIndex = indices[triangleIndex + 2] * 2;
                var uv2x = uvs[uIndex];
                var uv2y = uvs[uIndex + 1];
                var uv = new Vector2();
                uv.x = u * uv0x + v * uv1x + w * uv2x;
                uv.y = u * uv0y + v * uv1y + w * uv2y;
                return uv;
            }
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

        preRender(renderAtomic: RenderAtomic)
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
                }
            }
        }
    }
}