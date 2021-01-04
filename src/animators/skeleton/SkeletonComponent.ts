
export interface ComponentMap { SkeletonComponent: SkeletonComponent; }

@RegisterComponent()
export class SkeletonComponent extends Component
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
    private jointGameobjects: Transform[];
    private jointGameObjectMap: { [jointname: string]: Transform };
    private _globalPropertiesInvalid: boolean;
    private _jointsInvalid: boolean[];
    private _globalMatrixsInvalid: boolean[];
    private globalMatrixs: Matrix4x4[];
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
        var jointGameobjects = this.jointGameobjects;
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
            globalMatrixs[index] = jointGameobject.transform.matrix.clone();
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
                jointGameobject = serialization.setValue(new GameObject(), { name: skeletonJoint.name, hideFlags: feng3d.HideFlags.DontSave });
                parentGameobject.addChild(jointGameobject);
            }

            var transform = jointGameobject.transform;

            var matrix = skeletonJoint.matrix;
            if (skeletonJoint.parentIndex != -1)
            {
                matrix = matrix.clone().append(joints[skeletonJoint.parentIndex].invertMatrix);
            }
            transform.matrix = matrix;

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
