namespace feng3d
{
    export interface ComponentMap { SkeletonComponent: SkeletonComponent; }

    export class SkeletonComponent extends Component
    {

        __class__: "feng3d.SkeletonComponent" = "feng3d.SkeletonComponent";

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
        private jointGameobjects: Transform[];
        private jointGameObjectMap: { [jointname: string]: Transform };
        private _globalPropertiesInvalid: boolean;
        private _jointsInvalid: boolean[];
        private _globalMatrix3DsInvalid: boolean[];
        private globalMatrix3Ds: Matrix4x4[];
        private _globalMatrices: Matrix4x4[];

        initSkeleton()
        {
            this.jointGameobjects = [];
            this.jointGameObjectMap = {};
            //
            this.createSkeletonGameObject();

            //
            this._globalPropertiesInvalid = true;
            this._jointsInvalid = [];
            this._globalMatrix3DsInvalid = [];
            this.globalMatrix3Ds = [];
            this._globalMatrices = [];
            //
            var jointNum = this.joints.length;
            for (var i = 0; i < jointNum; i++)
            {
                this._jointsInvalid[i] = true;
                this._globalMatrix3DsInvalid[i] = true;
                this.globalMatrix3Ds[i] = new Matrix4x4();
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
            var jointGameobjects = this.jointGameobjects;
            var globalMatrix3Ds = this.globalMatrix3Ds;
            var _globalMatrix3DsInvalid = this._globalMatrix3DsInvalid;
            //遍历每个关节
            for (var i = 0; i < joints.length; ++i)
            {
                if (!this._jointsInvalid[i])
                    continue;

                this._globalMatrices[i]
                    .copyFrom(globalMatrix3d(i))
                    .prepend(joints[i].invertMatrix3D);

                this._jointsInvalid[i] = false;
            }

            function globalMatrix3d(index: number)
            {
                if (!_globalMatrix3DsInvalid[index])
                    return globalMatrix3Ds[index];

                var jointPose = joints[index];

                var jointGameobject = jointGameobjects[index];
                globalMatrix3Ds[index] = jointGameobject.transform.matrix3d.clone();
                if (jointPose.parentIndex >= 0)
                {
                    var parentGlobalMatrix3d = globalMatrix3d(jointPose.parentIndex);
                    globalMatrix3Ds[index].append(parentGlobalMatrix3d);
                }

                _globalMatrix3DsInvalid[index] = false;

                return globalMatrix3Ds[index];
            }
        }

        private invalidjoint(jointIndex: number)
        {
            this._globalPropertiesInvalid = true;
            this._jointsInvalid[jointIndex] = true;
            this._globalMatrix3DsInvalid[jointIndex] = true;

            this.joints[jointIndex].children.forEach(element =>
            {
                this.invalidjoint(element);
            });
        }

        private createSkeletonGameObject()
        {
            var skeleton = this;

            var joints = skeleton.joints;
            var jointGameobjects = this.jointGameobjects;
            var jointGameObjectMap = this.jointGameObjectMap;

            for (var i = 0; i < joints.length; i++)
            {
                createJoint(i);
            }

            function createJoint(i: number)
            {
                if (jointGameobjects[i])
                    return jointGameobjects[i].gameObject;

                var skeletonJoint = joints[i];
                var parentGameobject: GameObject;
                if (skeletonJoint.parentIndex != -1)
                {
                    parentGameobject = createJoint(skeletonJoint.parentIndex);
                    joints[skeletonJoint.parentIndex].children.push(i);
                } else
                {
                    parentGameobject = skeleton.gameObject
                }

                var jointGameobject = parentGameobject.find(skeletonJoint.name);
                if (!jointGameobject)
                {
                    jointGameobject = Object.setValue(new GameObject(), { name: skeletonJoint.name, hideFlags: feng3d.HideFlags.DontSave });
                    parentGameobject.addChild(jointGameobject);
                }

                var transform = jointGameobject.transform;

                var matrix3D = skeletonJoint.matrix3D;
                if (skeletonJoint.parentIndex != -1)
                {
                    matrix3D = matrix3D.clone().append(joints[skeletonJoint.parentIndex].invertMatrix3D);
                }
                transform.matrix3d = matrix3D;

                transform.on("transformChanged", () =>
                {
                    skeleton.invalidjoint(i);
                });

                jointGameobjects[i] = transform;
                jointGameObjectMap[skeletonJoint.name] = transform;
                return jointGameobject;
            }
        }
    }
}