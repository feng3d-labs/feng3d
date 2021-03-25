namespace feng3d
{
    export interface ComponentMap { SkeletonComponent: SkeletonComponent; }

    @RegisterComponent()
    export class SkeletonComponent extends Component3D
    {

        __class__: "feng3d.SkeletonComponent";

        /** 骨骼关节数据列表 */
        @serialize
        @oav()
        joints: SkeletonJoint[] = [];

        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        get globalMatrices(): Matrix4x4[]
        {
            if (!this.isInitJoints)
            {
                this.initSkeleton();
                this.isInitJoints = true;
            }

            if (this._globalPropertiesInvalid)
            {
                this.updateGlobalProperties();
                this._globalPropertiesInvalid = false;
            }
            return this._globalMatrices;
        }

        //
        private isInitJoints = false;
        private jointNode3Ds: Node3D[];
        private jointNode3DMap: { [jointname: string]: Node3D };
        private _globalPropertiesInvalid: boolean;
        private _jointsInvalid: boolean[];
        private _globalMatrixsInvalid: boolean[];
        private globalMatrixs: Matrix4x4[];
        private _globalMatrices: Matrix4x4[];

        initSkeleton()
        {
            this.jointNode3Ds = [];
            this.jointNode3DMap = {};
            //
            this.createSkeletonNode3D();

            //
            this._globalPropertiesInvalid = true;
            this._jointsInvalid = [];
            this._globalMatrixsInvalid = [];
            this.globalMatrixs = [];
            this._globalMatrices = [];
            //
            var jointNum = this.joints.length;
            for (var i = 0; i < jointNum; i++)
            {
                this._jointsInvalid[i] = true;
                this._globalMatrixsInvalid[i] = true;
                this.globalMatrixs[i] = new Matrix4x4();
                this._globalMatrices[i] = new Matrix4x4();
            }

        }

        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties()
        {
            //姿势变换矩阵
            var joints: SkeletonJoint[] = this.joints;
            var jointGameobjects = this.jointNode3Ds;
            var globalMatrixs = this.globalMatrixs;
            var _globalMatrixsInvalid = this._globalMatrixsInvalid;
            //遍历每个关节
            for (var i = 0; i < joints.length; ++i)
            {
                if (!this._jointsInvalid[i])
                    continue;

                this._globalMatrices[i]
                    .copy(globalMatrix(i))
                    .prepend(joints[i].invertMatrix);

                this._jointsInvalid[i] = false;
            }

            function globalMatrix(index: number)
            {
                if (!_globalMatrixsInvalid[index])
                    return globalMatrixs[index];

                var jointPose = joints[index];

                var jointGameobject = jointGameobjects[index];
                globalMatrixs[index] = jointGameobject.matrix.clone();
                if (jointPose.parentIndex >= 0)
                {
                    var parentGlobalMatrix = globalMatrix(jointPose.parentIndex);
                    globalMatrixs[index].append(parentGlobalMatrix);
                }

                _globalMatrixsInvalid[index] = false;

                return globalMatrixs[index];
            }
        }

        private invalidjoint(jointIndex: number)
        {
            this._globalPropertiesInvalid = true;
            this._jointsInvalid[jointIndex] = true;
            this._globalMatrixsInvalid[jointIndex] = true;

            this.joints[jointIndex].children.forEach(element =>
            {
                this.invalidjoint(element);
            });
        }

        private createSkeletonNode3D()
        {
            var skeleton = this;

            var joints = skeleton.joints;
            var jointNode3Ds = this.jointNode3Ds;
            var jointNode3DMap = this.jointNode3DMap;

            for (var i = 0; i < joints.length; i++)
            {
                createJoint(i);
            }

            function createJoint(i: number)
            {
                if (jointNode3Ds[i])
                    return jointNode3Ds[i];

                var skeletonJoint = joints[i];
                var parentNode3D: Node3D;
                if (skeletonJoint.parentIndex != -1)
                {
                    parentNode3D = createJoint(skeletonJoint.parentIndex);
                    joints[skeletonJoint.parentIndex].children.push(i);
                } else
                {
                    parentNode3D = skeleton.node3d
                }

                var jointTransform = parentNode3D.find(skeletonJoint.name);
                if (!jointTransform)
                {
                    var entity = new Entity();
                    entity.name = skeletonJoint.name;
                    entity.hideFlags = HideFlags.DontSave;
                    jointTransform = entity.addComponent(Node3D);
                    parentNode3D.addChild(jointTransform);
                }

                var node3d = jointTransform;

                var matrix = skeletonJoint.matrix;
                if (skeletonJoint.parentIndex != -1)
                {
                    matrix = matrix.clone().append(joints[skeletonJoint.parentIndex].invertMatrix);
                }
                node3d.matrix = matrix;

                node3d.on("transformChanged", () =>
                {
                    skeleton.invalidjoint(i);
                });

                jointNode3Ds[i] = node3d;
                jointNode3DMap[skeletonJoint.name] = node3d;
                return jointTransform;
            }
        }
    }
}