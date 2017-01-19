module feng3d {

    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    export class MD5Loader extends Loader {

        completed: (object3D: Object3D) => void;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, completed: (object3D: Object3D) => void = null) {

            this.url = url
            this.completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = MD5MeshParser.parse(e.data.content);

                this.createMD5Mesh(objData);
            }, this)
            loader.loadText(url);
        }

        public loadAnim(url: string, completed: (object3D: Object3D) => void = null) {

            this.url = url
            this.completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = this.objData = MD5AnimParser.parse(e.data.content);

                this.createObj();
            }, this)
            loader.loadText(url);
        }

        private createObj() {

            var object = new Object3D();

            if (this.completed) {
                this.completed(object);
            }
        }
        private _maxJointCount: number;
        private _bindPoses: Matrix3D[];
        private createMD5Mesh(md5MeshData: MD5MeshData) {

            //顶点最大关节关联数
            this._maxJointCount = this.calculateMaxJointCount(md5MeshData);

            this._bindPoses = this.initBindPoses(md5MeshData.joints);

            for (var i = 0; i < md5MeshData.meshs.length; i++) {
                this.createGeometry(md5MeshData.meshs[i])
            }

        }

        /**
		 * 计算最大关节数量
		 */
        private calculateMaxJointCount(md5MeshData: MD5MeshData) {
            var _maxJointCount = 0;

            //遍历所有的网格数据
            var numMeshData: number = md5MeshData.meshs.length;
            for (var i: number = 0; i < numMeshData; ++i) {
                var meshData: MD5_Mesh = md5MeshData.meshs[i];
                var vertexData: MD5_Vertex[] = meshData.verts;
                var numVerts: number = vertexData.length;

                //遍历每个顶点 寻找关节关联最大数量
                for (var j: number = 0; j < numVerts; ++j) {
                    var zeroWeights: number = this.countZeroWeightJoints(vertexData[j], meshData.weights);
                    var totalJoints: number = vertexData[j].countWeight - zeroWeights;
                    if (totalJoints > _maxJointCount)
                        _maxJointCount = totalJoints;
                }
            }
            return _maxJointCount;
        }

        /**
		 * 计算0权重关节数量
		 * @param vertex 顶点数据
		 * @param weights 关节权重数组
		 * @return
		 */
        private countZeroWeightJoints(vertex: MD5_Vertex, weights: MD5_Weight[]): number {
            var start: number = vertex.startWeight;
            var end: number = vertex.startWeight + vertex.countWeight;
            var count: number = 0;
            var weight: number;

            for (var i: number = start; i < end; ++i) {
                weight = weights[i].bias;
                if (weight == 0)
                    ++count;
            }

            return count;
        }

        private initBindPoses(joints: MD5_Joint[]) {

            var _bindPoses: Matrix3D[] = [];

            

            return _bindPoses;
        }

        private createGeometry(md5Mesh: MD5_Mesh) {

            var vertexData = md5Mesh.verts;
            var weights = md5Mesh.weights;
            var indices = md5Mesh.tris;

            var geometry = new Geometry();

            var len: number = vertexData.length;
            var v1: number, v2: number, v3: number;
            var vertex: MD5_Vertex;
            var weight: MD5_Weight;
            var bindPose: Matrix3D;
            var pos: Vector3D;
            //uv数据
            var uvs: number[] = [];
            uvs.length = len * 2;
            //顶点位置数据
            var vertices: number[] = [];
            vertices.length = len * 3;
            //关节索引数据
            var jointIndices: number[] = [];
            jointIndices.length = len * this._maxJointCount;
            //关节权重数据
            var jointWeights: number[] = [];
            jointWeights.length = len * this._maxJointCount;
            var l: number;
            //0权重个数
            var nonZeroWeights: number;

            for (var i: number = 0; i < len; ++i) {
                vertex = vertexData[i];
                v1 = vertex.index * 3;
                v2 = v1 + 1;
                v3 = v1 + 2;
                vertices[v1] = vertices[v2] = vertices[v3] = 0;

				/**
				 * 参考 http://blog.csdn.net/summerhust/article/details/17421213
				 * VertexPos = (MJ-0 * weight[index0].pos * weight[index0].bias) + ... + (MJ-N * weight[indexN].pos * weight[indexN].bias)
				 * 变量对应  MJ-N -> bindPose; 第J个关节的变换矩阵
				 * weight[indexN].pos -> weight.pos;
				 * weight[indexN].bias -> weight.bias;
				 */

                nonZeroWeights = 0;
                for (var j: number = 0; j < vertex.countWeight; ++j) {
                    weight = weights[vertex.startWeight + j];
                    if (weight.bias > 0) {
                        bindPose = this._bindPoses[weight.joint];
                        pos = bindPose.transformVector(new Vector3D(weight.pos[0], weight.pos[1], weight.pos[2]));
                        vertices[v1] += pos.x * weight.bias;
                        vertices[v2] += pos.y * weight.bias;
                        vertices[v3] += pos.z * weight.bias;

                        // indices need to be multiplied by 3 (amount of matrix registers)
                        jointIndices[l] = weight.joint * 3;
                        jointWeights[l++] = weight.bias;
                        ++nonZeroWeights;
                    }
                }

                for (j = nonZeroWeights; j < this._maxJointCount; ++j) {
                    jointIndices[l] = 0;
                    jointWeights[l++] = 0;
                }

                v1 = vertex.index << 1;
                uvs[v1++] = vertex.u;
                uvs[v1] = vertex.v;
            }

            //更新索引数据
            geometry.updateIndexData(indices);
            geometry.numVertices = vertices.length / 3;
            //更新顶点坐标与uv数据
            geometry.fromVectors(vertices, uvs);
            // cause explicit updates
            geometry.addComponent(new AutoDeriveVertexNormals());
            geometry.addComponent(new AutoDeriveVertexTangents());
            geometry.vertexNormalData;
            geometry.vertexTangentData;
            //更新关节索引与权重索引
            skinnedsubGeom.updateJointIndexData(jointIndices);
            skinnedsubGeom.updateJointWeightsData(jointWeights);


            return geometry;
        }
    }
}