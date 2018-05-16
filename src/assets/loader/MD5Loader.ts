namespace feng3d
{
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    export var MD5Loader = {
        load: load,
        loadAnim: loadAnim,
        parseMD5Mesh: parseMD5Mesh,
        parseMD5Anim: parseMD5Anim,
    }

    /**
     * 加载资源
     * @param url   路径
     */
    function load(url: string, completed?: (gameObject: GameObject) => void)
    {
        Loader.loadText(url, (content) =>
        {
            var objData = MD5MeshParser.parse(content);
            createMD5Mesh(objData, completed);
        });
    }

    function parseMD5Mesh(content: string, completed?: (gameObject: GameObject) => void)
    {
        var objData = MD5MeshParser.parse(content);
        createMD5Mesh(objData, completed);
    }

    function loadAnim(url: string, completed?: (animationClip: AnimationClip) => void)
    {
        Loader.loadText(url, (content) =>
        {
            var objData = MD5AnimParser.parse(content);
            createAnimator(objData, completed);
        });
    }

    function parseMD5Anim(content: string, completed?: (animationClip: AnimationClip) => void)
    {
        var objData = MD5AnimParser.parse(content);
        createAnimator(objData, completed);
    }

    function createMD5Mesh(md5MeshData: MD5MeshData, completed?: (gameObject: GameObject) => void)
    {
        var gameObject = GameObject.create();
        gameObject.addComponent(Animation);
        gameObject.transform.rx = -90;

        //顶点最大关节关联数
        var _maxJointCount = calculateMaxJointCount(md5MeshData);
        debuger && assert(_maxJointCount <= 8, "顶点最大关节关联数最多支持8个");

        var skeletonjoints = createSkeleton(md5MeshData.joints);

        var skeletonComponent = gameObject.addComponent(SkeletonComponent);
        skeletonComponent.joints = skeletonjoints;

        for (var i = 0; i < md5MeshData.meshs.length; i++)
        {
            var skinSkeleton = new SkinSkeletonTemp();
            var geometry = createGeometry(md5MeshData.meshs[i], skeletonComponent, skinSkeleton);

            var skeletonGameObject = GameObject.create();

            var skinnedMeshRenderer = skeletonGameObject.addComponent(SkinnedMeshRenderer);
            skinnedMeshRenderer.geometry = geometry;
            skinnedMeshRenderer.skinSkeleton = skinSkeleton;

            gameObject.addChild(skeletonGameObject);
        }

        completed && completed(gameObject);
    }

    /**
     * 计算最大关节数量
     */
    function calculateMaxJointCount(md5MeshData: MD5MeshData)
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
    function countZeroWeightJoints(vertex: MD5_Vertex, weights: MD5_Weight[]): number
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

    function createSkeleton(joints: MD5_Joint[])
    {
        var skeletonjoints: SkeletonJoint[] = [];
        for (var i = 0; i < joints.length; i++)
        {
            var skeletonJoint = createSkeletonJoint(joints[i]);
            skeletonjoints.push(skeletonJoint);
        }
        return skeletonjoints;
    }

    function createSkeletonJoint(joint: MD5_Joint)
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

    function createGeometry(md5Mesh: MD5_Mesh, skeleton: SkeletonComponent, skinSkeleton: SkinSkeletonTemp)
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

    function createAnimator(md5AnimData: MD5AnimData, completed?: (animationClip: AnimationClip) => void)
    {
        var animationClip = new AnimationClip();
        animationClip.length = md5AnimData.numFrames / md5AnimData.frameRate * 1000;
        animationClip.propertyClips = [];

        var __chache__: { [key: string]: PropertyClip } = {};

        for (var i = 0; i < md5AnimData.numFrames; ++i)
        {
            translatePose(md5AnimData, md5AnimData.frame[i], animationClip);
        }

        completed && completed(animationClip);

        /**
         * 将一个关键帧数据转换为SkeletonPose
         * @param frameData 帧数据
         * @return 包含帧数据的SkeletonPose对象
         */
        function translatePose(md5AnimData: MD5AnimData, frameData: MD5_Frame, animationclip: AnimationClip)
        {
            var hierarchy: MD5_HierarchyData;
            var base: MD5_BaseFrame;
            var flags: number;
            var j: number;
            //偏移量
            var translation: Vector3 = new Vector3();
            //旋转四元素
            var components: number[] = frameData.components;

            for (var i = 0; i < md5AnimData.numJoints; ++i)
            {
                //通过原始帧数据与层级数据计算出当前骨骼pose数据
                j = 0;
                //层级数据
                hierarchy = md5AnimData.hierarchy[i];
                //基础帧数据
                base = md5AnimData.baseframe[i];
                //层级标记
                flags = hierarchy.flags;
                translation.x = base.position[0];
                translation.y = base.position[1];
                translation.z = base.position[2];
                var orientation: Quaternion = new Quaternion();
                orientation.x = base.orientation[0];
                orientation.y = base.orientation[1];
                orientation.z = base.orientation[2];

                //调整位移与角度数据
                if (flags & 1)
                    translation.x = components[hierarchy.startIndex + (j++)];
                if (flags & 2)
                    translation.y = components[hierarchy.startIndex + (j++)];
                if (flags & 4)
                    translation.z = components[hierarchy.startIndex + (j++)];
                if (flags & 8)
                    orientation.x = components[hierarchy.startIndex + (j++)];
                if (flags & 16)
                    orientation.y = components[hierarchy.startIndex + (j++)];
                if (flags & 32)
                    orientation.z = components[hierarchy.startIndex + (j++)];

                //计算四元素w值
                var w = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
                orientation.w = w < 0 ? 0 : -Math.sqrt(w);

                orientation.y = -orientation.y;
                orientation.z = -orientation.z;
                translation.x = -translation.x;

                var eulers = orientation.toEulerAngles();
                eulers.scale(180 / Math.PI);

                var path: PropertyClipPath = [
                    [PropertyClipPathItemType.GameObject, hierarchy.name],
                    [PropertyClipPathItemType.Component, "feng3d.Transform"],
                ];

                var time = (frameData.index / md5AnimData.frameRate) * 1000;
                setPropertyClipFrame(path, "position", time, translation.toArray(), "Vector3");
                setPropertyClipFrame(path, "orientation", time, orientation.toArray(), "Quaternion");

            }

            function setPropertyClipFrame(path: PropertyClipPath, propertyName: string, time: number, propertyValue: number[], type: string)
            {
                var propertyClip = getPropertyClip(path, propertyName);
                propertyClip.type = <any>type;
                propertyClip.propertyValues.push([time, propertyValue]);
            }

            function getPropertyClip(path: PropertyClipPath, propertyName: string)
            {
                var key = path.join("-") + propertyName;
                if (__chache__[key])
                    return __chache__[key];
                if (!__chache__[key])
                {
                    var propertyClip = __chache__[key] = new PropertyClip();
                    propertyClip.path = path;
                    propertyClip.propertyName = propertyName;
                    propertyClip.propertyValues = [];
                    animationclip.propertyClips.push(propertyClip);
                }
                return __chache__[key];
            }

        }
    }

}
