namespace feng3d
{
    /**
     * MD5模型转换器
     */
    export var md5MeshConverter: MD5MeshConverter;

    /**
     * MD5模型转换器
     */
    export class MD5MeshConverter
    {

        /**
         * MD5模型数据转换为游戏对象
         * @param md5MeshData MD5模型数据
         * @param completed 转换完成回调
         */
        convert(md5MeshData: MD5MeshData, completed?: (gameObject: GameObject) => void)
        {
            var gameObject = new GameObject();
            gameObject.name = md5MeshData.name;
            gameObject.addComponent(Animation);
            gameObject.transform.rx = -90;

            //顶点最大关节关联数
            var _maxJointCount = this.calculateMaxJointCount(md5MeshData);
            debuger && assert(_maxJointCount <= 8, "顶点最大关节关联数最多支持8个");

            var skeletonjoints = this.createSkeleton(md5MeshData.joints);

            var skeletonComponent = gameObject.addComponent(SkeletonComponent);
            skeletonComponent.joints = skeletonjoints;

            for (var i = 0; i < md5MeshData.meshs.length; i++)
            {
                var skinSkeleton = new SkinSkeletonTemp();
                var geometry = this.createGeometry(md5MeshData.meshs[i], skeletonComponent, skinSkeleton);

                var skeletonGameObject = new GameObject();

                var skinnedModel: SkinnedModel = skeletonGameObject.addComponent(SkinnedModel);
                skinnedModel.geometry = geometry;
                skinnedModel.skinSkeleton = skinSkeleton;

                gameObject.addChild(skeletonGameObject);
            }

            feng3dDispatcher.dispatch("assets.parsed", gameObject);
            completed && completed(gameObject);
        }

        /**
         * 计算最大关节数量
         */
        private calculateMaxJointCount(md5MeshData: MD5MeshData)
        {
            var _maxJointCount = 0;

            //遍历所有的网格数据
            var numMeshData = md5MeshData.meshs.length;
            for (var i = 0; i < numMeshData; ++i)
            {
                var meshData: MD5_Mesh = md5MeshData.meshs[i];
                var vertexData: MD5_Vertex[] = meshData.verts;
                var numVerts = vertexData.length;

                //遍历每个顶点 寻找关节关联最大数量
                for (var j = 0; j < numVerts; ++j)
                {
                    var zeroWeights = this.countZeroWeightJoints(vertexData[j], meshData.weights);
                    var totalJoints = vertexData[j].countWeight - zeroWeights;
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
        private countZeroWeightJoints(vertex: MD5_Vertex, weights: MD5_Weight[]): number
        {
            var start = vertex.startWeight;
            var end = vertex.startWeight + vertex.countWeight;
            var count = 0;
            var weight: number;

            for (var i = start; i < end; ++i)
            {
                weight = weights[i].bias;
                if (weight == 0)
                    ++count;
            }

            return count;
        }

        private createSkeleton(joints: MD5_Joint[])
        {
            var skeletonjoints: SkeletonJoint[] = [];
            for (var i = 0; i < joints.length; i++)
            {
                var skeletonJoint = this.createSkeletonJoint(joints[i]);
                skeletonjoints.push(skeletonJoint);
            }
            return skeletonjoints;
        }

        private createSkeletonJoint(joint: MD5_Joint)
        {
            var skeletonJoint = new SkeletonJoint();
            skeletonJoint.name = joint.name;
            skeletonJoint.parentIndex = joint.parentIndex;
            var position = joint.position;
            var rotation = joint.rotation;
            var quat = new Quaternion(rotation[0], -rotation[1], -rotation[2]);
            // quat supposed to be unit length
            var t = 1 - quat.x * quat.x - quat.y * quat.y - quat.z * quat.z;
            quat.w = t < 0 ? 0 : -Math.sqrt(t);
            //
            var matrix3D = quat.toMatrix3D();
            matrix3D.appendTranslation(-position[0], position[1], position[2]);
            //
            skeletonJoint.matrix3D = matrix3D;
            return skeletonJoint;
        }

        private createGeometry(md5Mesh: MD5_Mesh, skeleton: SkeletonComponent, skinSkeleton: SkinSkeletonTemp)
        {
            var vertexData = md5Mesh.verts;
            var weights = md5Mesh.weights;
            var indices = md5Mesh.tris;

            var geometry = new CustomGeometry();

            var len = vertexData.length;
            var vertex: MD5_Vertex;
            var weight: MD5_Weight;
            var bindPose: Matrix4x4;
            var pos: Vector3;
            //uv数据
            var uvs: number[] = [];
            uvs.length = len * 2;
            //顶点位置数据
            var vertices: number[] = [];
            vertices.length = len * 3;
            //关节索引数据
            var jointIndices0: number[] = [];
            jointIndices0.length = len * 4;
            var jointIndices1: number[] = [];
            jointIndices1.length = len * 4;
            //关节权重数据
            var jointWeights0: number[] = [];
            jointWeights0.length = len * 4;
            var jointWeights1: number[] = [];
            jointWeights1.length = len * 4;

            for (var i = 0; i < len; ++i)
            {
                vertex = vertexData[i];
                vertices[i * 3] = vertices[i * 3 + 1] = vertices[i * 3 + 2] = 0;

                /**
                 * 参考 http://blog.csdn.net/summerhust/article/details/17421213
                 * VertexPos = (MJ-0 * weight[index0].pos * weight[index0].bias) + ... + (MJ-N * weight[indexN].pos * weight[indexN].bias)
                 * 变量对应  MJ-N -> bindPose; 第J个关节的变换矩阵
                 * weight[indexN].pos -> weight.pos;
                 * weight[indexN].bias -> weight.bias;
                 */
                var weightJoints: number[] = [];
                var weightBiass: number[] = [];
                for (var j = 0; j < 8; ++j)
                {
                    weightJoints[j] = 0;
                    weightBiass[j] = 0;
                    if (j < vertex.countWeight)
                    {
                        weight = weights[vertex.startWeight + j];
                        if (weight.bias > 0)
                        {
                            bindPose = skeleton.joints[weight.joint].matrix3D;
                            pos = bindPose.transformVector(new Vector3(-weight.pos[0], weight.pos[1], weight.pos[2]));
                            vertices[i * 3] += pos.x * weight.bias;
                            vertices[i * 3 + 1] += pos.y * weight.bias;
                            vertices[i * 3 + 2] += pos.z * weight.bias;

                            weightJoints[j] = weight.joint;
                            weightBiass[j] = weight.bias;
                        }
                    }
                }

                jointIndices0[i * 4] = weightJoints[0];
                jointIndices0[i * 4 + 1] = weightJoints[1];
                jointIndices0[i * 4 + 2] = weightJoints[2];
                jointIndices0[i * 4 + 3] = weightJoints[3];
                jointIndices1[i * 4] = weightJoints[4];
                jointIndices1[i * 4 + 1] = weightJoints[5];
                jointIndices1[i * 4 + 2] = weightJoints[6];
                jointIndices1[i * 4 + 3] = weightJoints[7];
                //
                jointWeights0[i * 4] = weightBiass[0];
                jointWeights0[i * 4 + 1] = weightBiass[1];
                jointWeights0[i * 4 + 2] = weightBiass[2];
                jointWeights0[i * 4 + 3] = weightBiass[3];
                jointWeights1[i * 4] = weightBiass[4];
                jointWeights1[i * 4 + 1] = weightBiass[5];
                jointWeights1[i * 4 + 2] = weightBiass[6];
                jointWeights1[i * 4 + 3] = weightBiass[7];

                uvs[vertex.index * 2] = vertex.u;
                uvs[vertex.index * 2 + 1] = vertex.v;
            }

            skinSkeleton.resetJointIndices(jointIndices0, skeleton);
            skinSkeleton.resetJointIndices(jointIndices1, skeleton);

            //更新索引数据
            geometry.indices = indices;
            //更新顶点坐标与uv数据
            geometry.setVAData("a_position", vertices, 3);
            geometry.setVAData("a_uv", uvs, 2);
            //更新关节索引与权重索引
            geometry.setVAData("a_jointindex0", jointIndices0, 4);
            geometry.setVAData("a_jointweight0", jointWeights0, 4);
            geometry.setVAData("a_jointindex1", jointIndices1, 4);
            geometry.setVAData("a_jointweight1", jointWeights1, 4);
            return geometry;
        }

    }

    md5MeshConverter = new MD5MeshConverter();
}