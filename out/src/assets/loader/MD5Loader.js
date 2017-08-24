var feng3d;
(function (feng3d) {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    feng3d.MD5Loader = {
        load: load,
        loadAnim: loadAnim,
    };
    /**
     * 加载资源
     * @param url   路径
     */
    function load(url, completed) {
        if (completed === void 0) { completed = null; }
        feng3d.Loader.loadText(url, function (content) {
            var objData = feng3d.MD5MeshParser.parse(content);
            createMD5Mesh(objData, completed);
        });
    }
    function loadAnim(url, completed) {
        if (completed === void 0) { completed = null; }
        feng3d.Loader.loadText(url, function (content) {
            var objData = feng3d.MD5AnimParser.parse(content);
            createAnimator(objData, completed);
        });
    }
    function createMD5Mesh(md5MeshData, completed) {
        var object3D = feng3d.GameObject.create();
        //顶点最大关节关联数
        var _maxJointCount = calculateMaxJointCount(md5MeshData);
        feng3d.debuger && console.assert(_maxJointCount <= 8, "顶点最大关节关联数最多支持8个");
        var skeleton = createSkeleton(md5MeshData.joints);
        var skeletonAnimator;
        for (var i = 0; i < md5MeshData.meshs.length; i++) {
            var geometry = createGeometry(md5MeshData.meshs[i], skeleton);
            var skeletonObject3D = feng3d.GameObject.create();
            skeletonObject3D.addComponent(feng3d.MeshRenderer).material = new feng3d.StandardMaterial();
            skeletonObject3D.addComponent(feng3d.MeshFilter).mesh = geometry;
            skeletonAnimator = skeletonObject3D.addComponent(feng3d.SkeletonAnimator);
            skeletonAnimator.skeleton = skeleton;
            object3D.addChild(skeletonObject3D);
        }
        completed && completed(object3D, skeletonAnimator);
    }
    /**
     * 计算最大关节数量
     */
    function calculateMaxJointCount(md5MeshData) {
        var _maxJointCount = 0;
        //遍历所有的网格数据
        var numMeshData = md5MeshData.meshs.length;
        for (var i = 0; i < numMeshData; ++i) {
            var meshData = md5MeshData.meshs[i];
            var vertexData = meshData.verts;
            var numVerts = vertexData.length;
            //遍历每个顶点 寻找关节关联最大数量
            for (var j = 0; j < numVerts; ++j) {
                var zeroWeights = countZeroWeightJoints(vertexData[j], meshData.weights);
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
    function countZeroWeightJoints(vertex, weights) {
        var start = vertex.startWeight;
        var end = vertex.startWeight + vertex.countWeight;
        var count = 0;
        var weight;
        for (var i = start; i < end; ++i) {
            weight = weights[i].bias;
            if (weight == 0)
                ++count;
        }
        return count;
    }
    function createSkeleton(joints) {
        var skeleton = new feng3d.Skeleton();
        for (var i = 0; i < joints.length; i++) {
            var skeletonJoint = createSkeletonJoint(joints[i]);
            skeleton.joints.push(skeletonJoint);
        }
        return skeleton;
    }
    function createSkeletonJoint(joint) {
        var skeletonJoint = new feng3d.SkeletonJoint();
        skeletonJoint.name = joint.name;
        skeletonJoint.parentIndex = joint.parentIndex;
        var position = joint.position;
        var rotation = joint.rotation;
        var quat = new feng3d.Quaternion(rotation[0], -rotation[1], -rotation[2]);
        // quat supposed to be unit length
        var t = 1 - quat.x * quat.x - quat.y * quat.y - quat.z * quat.z;
        quat.w = t < 0 ? 0 : -Math.sqrt(t);
        //
        skeletonJoint.translation = new feng3d.Vector3D(-position[0], position[1], position[2]);
        skeletonJoint.translation = skeletonJoint.translation;
        //
        skeletonJoint.orientation = quat;
        return skeletonJoint;
    }
    function createGeometry(md5Mesh, skeleton) {
        var vertexData = md5Mesh.verts;
        var weights = md5Mesh.weights;
        var indices = md5Mesh.tris;
        var geometry = new feng3d.Geometry();
        var len = vertexData.length;
        var vertex;
        var weight;
        var bindPose;
        var pos;
        //uv数据
        var uvs = [];
        uvs.length = len * 2;
        //顶点位置数据
        var vertices = [];
        vertices.length = len * 3;
        //关节索引数据
        var jointIndices0 = [];
        jointIndices0.length = len * 4;
        var jointIndices1 = [];
        jointIndices1.length = len * 4;
        //关节权重数据
        var jointWeights0 = [];
        jointWeights0.length = len * 4;
        var jointWeights1 = [];
        jointWeights1.length = len * 4;
        for (var i = 0; i < len; ++i) {
            vertex = vertexData[i];
            vertices[i * 3] = vertices[i * 3 + 1] = vertices[i * 3 + 2] = 0;
            /**
             * 参考 http://blog.csdn.net/summerhust/article/details/17421213
             * VertexPos = (MJ-0 * weight[index0].pos * weight[index0].bias) + ... + (MJ-N * weight[indexN].pos * weight[indexN].bias)
             * 变量对应  MJ-N -> bindPose; 第J个关节的变换矩阵
             * weight[indexN].pos -> weight.pos;
             * weight[indexN].bias -> weight.bias;
             */
            var weightJoints = [];
            var weightBiass = [];
            for (var j = 0; j < 8; ++j) {
                weightJoints[j] = 0;
                weightBiass[j] = 0;
                if (j < vertex.countWeight) {
                    weight = weights[vertex.startWeight + j];
                    if (weight.bias > 0) {
                        bindPose = skeleton.joints[weight.joint].matrix3D;
                        pos = bindPose.transformVector(new feng3d.Vector3D(-weight.pos[0], weight.pos[1], weight.pos[2]));
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
        //更新索引数据
        geometry.setIndices(new Uint16Array(indices));
        //更新顶点坐标与uv数据
        geometry.setVAData("a_position", new Float32Array(vertices), 3);
        geometry.setVAData("a_uv", new Float32Array(uvs), 2);
        geometry.createVertexNormals();
        //
        var tangents = feng3d.GeometryUtils.createVertexTangents(indices, vertices, uvs);
        geometry.setVAData("a_tangent", new Float32Array(tangents), 3);
        //更新关节索引与权重索引
        geometry.setVAData("a_jointindex0", new Float32Array(jointIndices0), 4);
        geometry.setVAData("a_jointweight0", new Float32Array(jointWeights0), 4);
        geometry.setVAData("a_jointindex1", new Float32Array(jointIndices1), 4);
        geometry.setVAData("a_jointweight1", new Float32Array(jointWeights1), 4);
        return geometry;
    }
    function createAnimator(md5AnimData, completed) {
        var object = feng3d.GameObject.create();
        var _clip = new feng3d.SkeletonClipNode();
        for (var i = 0; i < md5AnimData.numFrames; ++i)
            _clip.addFrame(translatePose(md5AnimData, md5AnimData.frame[i]), 1000 / md5AnimData.frameRate);
        completed && completed(_clip);
    }
    /**
     * 将一个关键帧数据转换为SkeletonPose
     * @param frameData 帧数据
     * @return 包含帧数据的SkeletonPose对象
     */
    function translatePose(md5AnimData, frameData) {
        var hierarchy;
        var pose;
        var base;
        var flags;
        var j;
        //偏移量
        var translate = new feng3d.Vector3D();
        //旋转四元素
        var orientation = new feng3d.Quaternion();
        var components = frameData.components;
        //骨骼pose数据
        var skelPose = new feng3d.SkeletonPose();
        //骨骼pose列表
        var jointPoses = skelPose.jointPoses;
        for (var i = 0; i < md5AnimData.numJoints; ++i) {
            //通过原始帧数据与层级数据计算出当前骨骼pose数据
            j = 0;
            //层级数据
            hierarchy = md5AnimData.hierarchy[i];
            //基础帧数据
            base = md5AnimData.baseframe[i];
            //层级标记
            flags = hierarchy.flags;
            translate.x = base.position[0];
            translate.y = base.position[1];
            translate.z = base.position[2];
            orientation.x = base.orientation[0];
            orientation.y = base.orientation[1];
            orientation.z = base.orientation[2];
            //调整位移与角度数据
            if (flags & 1)
                translate.x = components[hierarchy.startIndex + (j++)];
            if (flags & 2)
                translate.y = components[hierarchy.startIndex + (j++)];
            if (flags & 4)
                translate.z = components[hierarchy.startIndex + (j++)];
            if (flags & 8)
                orientation.x = components[hierarchy.startIndex + (j++)];
            if (flags & 16)
                orientation.y = components[hierarchy.startIndex + (j++)];
            if (flags & 32)
                orientation.z = components[hierarchy.startIndex + (j++)];
            //计算四元素w值
            var w = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
            orientation.w = w < 0 ? 0 : -Math.sqrt(w);
            //创建关节pose数据
            pose = new feng3d.JointPose();
            pose.name = hierarchy.name;
            pose.parentIndex = hierarchy.parentIndex;
            pose.orientation.copyFrom(orientation);
            pose.translation.x = translate.x;
            pose.translation.y = translate.y;
            pose.translation.z = translate.z;
            pose.orientation.y = -pose.orientation.y;
            pose.orientation.z = -pose.orientation.z;
            pose.translation.x = -pose.translation.x;
            jointPoses[i] = pose;
        }
        return skelPose;
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=MD5Loader.js.map