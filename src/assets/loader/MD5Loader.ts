module feng3d {

    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    export class MD5Loader extends Loader {

        completed: (object3D: Object3D, skeletonAnimator: SkeletonAnimator) => void;
        animCompleted: (skeletonClipNode: SkeletonClipNode) => void;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, completed: (object3D: Object3D, skeletonAnimator: SkeletonAnimator) => void = null) {

            this.url = url
            this.completed = completed;

            //初始化 旋转四元素
            this._rotationQuat = new Quaternion();
            this._rotationQuat.fromAxisAngle(Vector3D.X_AXIS, -Math.PI * .5);

            //初始化旋转四元素
            this._animRotationQuat = new Quaternion();
            var t1: Quaternion = new Quaternion();
            var t2: Quaternion = new Quaternion();

            t1.fromAxisAngle(Vector3D.X_AXIS, -Math.PI * .5);
            t2.fromAxisAngle(Vector3D.Y_AXIS, -Math.PI * .5);

            this._animRotationQuat.multiply(t2, t1);

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = MD5MeshParser.parse(e.data.content);

                this.createMD5Mesh(objData);
            }, this)
            loader.loadText(url);
        }

        public loadAnim(url: string, completed: (object3D: SkeletonClipNode) => void = null) {

            this.url = url
            this.animCompleted = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = MD5AnimParser.parse(e.data.content);

                this.createAnimator(objData);
            }, this)
            loader.loadText(url);
        }

        private _maxJointCount: number;
        private _skeleton: Skeleton;
        private createMD5Mesh(md5MeshData: MD5MeshData) {

            var object3D = new Object3D();

            //顶点最大关节关联数
            this._maxJointCount = this.calculateMaxJointCount(md5MeshData);

            this._skeleton = this.createSkeleton(md5MeshData.joints);
            var skeletonAnimator = new SkeletonAnimator();
            skeletonAnimator.skeleton = this._skeleton;

            for (var i = 0; i < md5MeshData.meshs.length; i++) {
                var geometry = this.createGeometry(md5MeshData.meshs[i]);

                var skeletonObject3D = new Object3D();
                skeletonObject3D.getOrCreateComponentByClass(MeshFilter).geometry = geometry;
                skeletonObject3D.getOrCreateComponentByClass(MeshRenderer).material = new SkeletonAnimatorMaterial();
                skeletonObject3D.addComponent(skeletonAnimator);

                object3D.addChild(skeletonObject3D);
            }

            if (this.completed) {
                this.completed(object3D, skeletonAnimator);
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

        private createSkeleton(joints: MD5_Joint[]) {

            var skeleton: Skeleton = new Skeleton();
            for (var i = 0; i < joints.length; i++) {
                var skeletonJoint = this.createSkeletonJoint(joints[i]);
                skeleton.joints.push(skeletonJoint);
            }
            return skeleton;
        }
        /** 旋转四元素 */
        private _rotationQuat: Quaternion;
        /** 旋转四元素 */
        private _animRotationQuat: Quaternion;

        private createSkeletonJoint(joint: MD5_Joint) {
            var skeletonJoint = new SkeletonJoint();
            skeletonJoint.name = joint.name;
            skeletonJoint.parentIndex = joint.parentIndex;
            var position = joint.position;
            var rotation = joint.rotation;
            var quat = new Quaternion(rotation[0], -rotation[1], -rotation[2]);
            // quat supposed to be unit length
            var t: number = 1 - quat.x * quat.x - quat.y * quat.y - quat.z * quat.z;
            quat.w = t < 0 ? 0 : -Math.sqrt(t);
            //
            skeletonJoint.position = new Vector3D(-position[0], position[1], position[2]);
            skeletonJoint.position = this._rotationQuat.rotatePoint(skeletonJoint.position);
            //
            var rotQuat: Quaternion = new Quaternion();
            rotQuat.multiply(this._rotationQuat, quat);
            skeletonJoint.rotation = rotQuat;
            return skeletonJoint;
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
            var l: number = 0;
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
                        bindPose = this._skeleton.joints[weight.joint].matrix;
                        pos = bindPose.transformVector(new Vector3D(weight.pos[0], weight.pos[1], weight.pos[2]));
                        vertices[v1] += (-pos.x) * weight.bias;
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
            geometry.setIndices(new Uint16Array(indices));
            //更新顶点坐标与uv数据
            geometry.setVAData(GLAttribute.a_position, new Float32Array(vertices), 3);
            geometry.setVAData(GLAttribute.a_uv, new Float32Array(uvs), 2);
            //更新关节索引与权重索引
            geometry.setVAData(GLAttribute.a_jointindex, new Float32Array(jointIndices), this._maxJointCount);
            geometry.setVAData(GLAttribute.a_jointweight, new Float32Array(jointWeights), this._maxJointCount);
            return geometry;
        }

        private createAnimator(md5AnimData: MD5AnimData) {

            var object = new Object3D();

            var _clip = new SkeletonClipNode();
            for (var i: number = 0; i < md5AnimData.numFrames; ++i)
                _clip.addFrame(this.translatePose(md5AnimData, md5AnimData.frame[i]), 1000 / md5AnimData.frameRate);

            if (this.animCompleted) {
                this.animCompleted(_clip);
            }
        }

		/**
		 * 将一个关键帧数据转换为SkeletonPose
		 * @param frameData 帧数据
		 * @return 包含帧数据的SkeletonPose对象
		 */
        private translatePose(md5AnimData: MD5AnimData, frameData: MD5_Frame): SkeletonPose {
            var hierarchy: MD5_HierarchyData;
            var pose: JointPose;
            var base: MD5_BaseFrame;
            var flags: number;
            var j: number;
            //偏移量
            var translate: Vector3D = new Vector3D();
            //旋转四元素
            var orientation: Quaternion = new Quaternion();
            var components: number[] = frameData.components;
            //骨骼pose数据
            var skelPose: SkeletonPose = new SkeletonPose();
            //骨骼pose列表
            var jointPoses: JointPose[] = skelPose.jointPoses;

            for (var i: number = 0; i < md5AnimData.numJoints; ++i) {
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
                var w: number = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
                orientation.w = w < 0 ? 0 : -Math.sqrt(w);

                //创建关节pose数据
                pose = new JointPose();
                if (hierarchy.parentIndex < 0) {
                    pose.orientation.multiply(this._animRotationQuat, orientation);
                    pose.translation = this._animRotationQuat.rotatePoint(translate);
                }
                else {
                    pose.orientation.copyFrom(orientation);
                    pose.translation.x = translate.x;
                    pose.translation.y = translate.y;
                    pose.translation.z = translate.z;
                }
                pose.orientation.y = -pose.orientation.y;
                pose.orientation.z = -pose.orientation.z;
                pose.translation.x = -pose.translation.x;

                jointPoses[i] = pose;
            }

            return skelPose;
        }

    }
}