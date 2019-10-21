namespace CANNON
{
    /**
     * 三角网格
     */
    export class Trimesh extends Shape
    {
        type = ShapeType.TRIMESH;

        /**
         * 顶点坐标数据
         */
        vertices: number[];
        /**
         * 面法线数据
         */
        normals: number[];
        /**
         * 包围盒
         */
        aabb: feng3d.AABB;
        /**
         * 边数组
         */
        edges: number[];

        /**
         * 索引的三角形。使用. updatetree()更新它。
         */
        tree: Octree;

        /**
         * @param vertices
         * @param indices
         * 
         * @example
         *     // How to make a mesh with a single triangle
         *     var vertices = [
         *         0, 0, 0, // vertex 0
         *         1, 0, 0, // vertex 1
         *         0, 1, 0  // vertex 2
         *     ];
         *     var indices = [
         *         0, 1, 2  // triangle 0
         *     ];
         *     var trimeshShape = new Trimesh(vertices, indices);
         */
        constructor(vertices: number[], indices: number[])
        {
            super();

            this.vertices = vertices;

            this.indices = indices;

            this.normals = [];

            this.aabb = new feng3d.AABB();

            this.edges = null;

            this.tree = new Octree();

            this.updateEdges();
            this.updateNormals();
            this.updateAABB();
            this.updateBoundingSphereRadius();
            this.updateTree();
        }

        /**
         * 更新树
         */
        updateTree()
        {
            var tree = this.tree;

            tree.reset();
            tree.aabb.copy(this.aabb);

            // Insert all triangles
            var triangleAABB = new feng3d.AABB();
            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var points = [a, b, c];
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                // Get unscaled triangle verts
                var i3 = i * 3;
                this.getVertex(this.indices[i3], a);
                this.getVertex(this.indices[i3 + 1], b);
                this.getVertex(this.indices[i3 + 2], c);

                triangleAABB.fromPoints(points);
                tree.insert(triangleAABB, i);
            }
            tree.removeEmptyNodes();
        }

        /**
         * 从trimesh获取本地AABB中的三角形。
         * 
         * @param aabb
         * @param result 一个整数数组，引用查询的三角形。
         */
        getTrianglesInAABB(aabb: feng3d.AABB, result: number[])
        {
            var unscaledAABB = new feng3d.AABB();
            unscaledAABB.copy(aabb);

            return this.tree.aabbQuery(unscaledAABB, result);
        }

        /**
         * 计算法线
         */
        updateNormals()
        {
            var n = new feng3d.Vector3();

            var va = new feng3d.Vector3();
            var vb = new feng3d.Vector3();
            var vc = new feng3d.Vector3();

            // Generate normals
            var normals = this.normals;
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                var i3 = i * 3;

                var a = this.indices[i3],
                    b = this.indices[i3 + 1],
                    c = this.indices[i3 + 2];

                this.getVertex(a, va);
                this.getVertex(b, vb);
                this.getVertex(c, vc);

                var tri = new feng3d.Triangle3D(vb, va, vc);
                tri.getNormal(n);

                normals[i3] = n.x;
                normals[i3 + 1] = n.y;
                normals[i3 + 2] = n.z;
            }
        }

        /**
         * 更新边数组
         */
        updateEdges()
        {
            var edges = {};
            var add = function (a: number, b: number)
            {
                var key = a < b ? a + '_' + b : b + '_' + a;
                edges[key] = true;
            };
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                var i3 = i * 3;
                var a = this.indices[i3],
                    b = this.indices[i3 + 1],
                    c = this.indices[i3 + 2];
                add(a, b);
                add(b, c);
                add(c, a);
            }
            var keys = Object.keys(edges);
            this.edges = [];
            for (var i = 0; i < keys.length; i++)
            {
                var indices = keys[i].split('_');
                this.edges[2 * i] = parseInt(indices[0], 10);
                this.edges[2 * i + 1] = parseInt(indices[1], 10);
            }
        }

        /**
         * 获取边的顶点
         * 
         * @param edgeIndex
         * @param firstOrSecond 0还是1，取决于你需要哪个顶点。
         * @param vertexStore 保存结果
         */
        getEdgeVertex(edgeIndex: number, firstOrSecond: number, vertexStore: feng3d.Vector3)
        {
            var vertexIndex = this.edges[edgeIndex * 2 + (firstOrSecond ? 1 : 0)];
            this.getVertex(vertexIndex, vertexStore);
        }

        /**
         * 沿着一条边得到一个向量。
         * 
         * @param edgeIndex
         * @param vectorStore
         */
        getEdgeVector(edgeIndex: number, vectorStore: feng3d.Vector3)
        {
            var va = new feng3d.Vector3();
            var vb = new feng3d.Vector3();
            this.getEdgeVertex(edgeIndex, 0, va);
            this.getEdgeVertex(edgeIndex, 1, vb);
            vb.subTo(va, vectorStore);
        }

        /**
         * 得到3个顶点的法向量
         * 
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        static computeNormal(va: feng3d.Vector3, vb: feng3d.Vector3, vc: feng3d.Vector3, target: feng3d.Vector3)
        {
            var cb = new feng3d.Vector3();
            var ab = new feng3d.Vector3();
            vb.subTo(va, ab);
            vc.subTo(vb, cb);
            cb.crossTo(ab, target);
            if (!target.isZero())
            {
                target.normalize();
            }
        }

        /**
         * 获取顶点
         * 
         * @param i
         * @param out
         * @return The "out" vector object
         */
        getVertex(i: number, out = new feng3d.Vector3())
        {
            var i3 = i * 3;
            var vertices = this.vertices;
            return out.init(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
        }

        /**
         * 通过给定的位置和四元数转换，从三元组中得到一个顶点。
         * 
         * @param i
         * @param pos
         * @param quat
         * @param out
         * @return The "out" vector object
         */
        getWorldVertex(i: number, transform: Transform, out: feng3d.Vector3)
        {
            this.getVertex(i, out);
            transform.pointToWorldFrame(out, out);
            return out;
        }

        /**
         * 从三角形中获取三个顶点
         * 
         * @param i
         * @param a
         * @param b
         * @param c
         */
        getTriangleVertices(i: number, a: feng3d.Vector3, b: feng3d.Vector3, c: feng3d.Vector3)
        {
            var i3 = i * 3;
            this.getVertex(this.indices[i3], a);
            this.getVertex(this.indices[i3 + 1], b);
            this.getVertex(this.indices[i3 + 2], c);
        }

        /**
         * 获取三角形的法线
         * 
         * @param i
         * @param target
         * @return The "target" vector object
         */
        getNormal(i: number, target: feng3d.Vector3)
        {
            var i3 = i * 3;
            return target.init(
                this.normals[i3],
                this.normals[i3 + 1],
                this.normals[i3 + 2]
            );
        }

        /**
         * 
         * @param mass
         * @param target
         * @return The "target" vector object
         */
        calculateLocalInertia(mass: number, target: feng3d.Vector3)
        {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            var cli_aabb = new feng3d.AABB();
            this.computeLocalAABB(cli_aabb);
            var x = cli_aabb.max.x - cli_aabb.min.x,
                y = cli_aabb.max.y - cli_aabb.min.y,
                z = cli_aabb.max.z - cli_aabb.min.z;
            return target.init(
                1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z),
                1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z),
                1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x)
            );
        }

        /**
         * 计算包围盒
         * 
         * @param aabb
         */
        computeLocalAABB(aabb: feng3d.AABB)
        {
            var l = aabb.min,
                u = aabb.max,
                n = this.vertices.length,
                v = new feng3d.Vector3();

            this.getVertex(0, v);
            l.copy(v);
            u.copy(v);

            for (var i = 0; i !== n; i++)
            {
                this.getVertex(i, v);

                if (v.x < l.x)
                {
                    l.x = v.x;
                } else if (v.x > u.x)
                {
                    u.x = v.x;
                }

                if (v.y < l.y)
                {
                    l.y = v.y;
                } else if (v.y > u.y)
                {
                    u.y = v.y;
                }

                if (v.z < l.z)
                {
                    l.z = v.z;
                } else if (v.z > u.z)
                {
                    u.z = v.z;
                }
            }
        }

        /**
         * 更新包围盒
         */
        updateAABB()
        {
            this.computeLocalAABB(this.aabb);
        }

        /**
         * 更新此形状的局部包围球半径
         */
        updateBoundingSphereRadius()
        {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var vertices = this.vertices;
            var v = new feng3d.Vector3();
            for (var i = 0, N = vertices.length / 3; i !== N; i++)
            {
                this.getVertex(i, v);
                var norm2 = v.lengthSquared;
                if (norm2 > max2)
                {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        }

        /**
         * 计算世界包围盒
         * 
         * @param pos 
         * @param quat 
         * @param min 
         * @param max 
         */
        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            // 使用局部AABB进行更快的近似
            var frame = new Transform();
            var result = new feng3d.AABB();
            frame.position = pos;
            frame.quaternion = quat;

            var mat = frame.toMatrix3D();
            result.copy(this.aabb).applyMatrix3D(mat);

            min.copy(result.min);
            max.copy(result.max);
        };

        /**
         * 得到近似体积
         */
        volume()
        {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        }
    }
}