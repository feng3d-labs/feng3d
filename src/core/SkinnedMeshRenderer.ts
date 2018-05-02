namespace feng3d
{
    export class SkinnedMeshRenderer extends MeshRenderer
    {
        get single() { return true; }

        @serialize()
        @oav()
        get skinSkeleton()
        {
            return this._skinSkeleton;
        }
        set skinSkeleton(value)
        {
            if (this._skinSkeleton == value)
                return;
            this._skinSkeleton = value;
        }
        private _skinSkeleton: SkinSkeleton;

        private skeletonGlobalMatriices: Matrix4x4[] = [];

        /**
         * 缓存，通过寻找父节点获得
         */
        private cacheSkeletonComponent: SkeletonComponent | null;

        @serialize()
        initMatrix3d: Matrix4x4;

        /**
		 * 创建一个骨骼动画类
		 */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
        }

        private get u_modelMatrix()
        {
            if (this.cacheSkeletonComponent)
                return this.cacheSkeletonComponent.transform.localToWorldMatrix;
            return this.transform.localToWorldMatrix
        }

        private get u_ITModelMatrix()
        {
            if (this.cacheSkeletonComponent)
                return this.cacheSkeletonComponent.transform.ITlocalToWorldMatrix;
            return this.transform.ITlocalToWorldMatrix
        }

        private get u_skeletonGlobalMatriices() 
        {
            if (!this.cacheSkeletonComponent)
            {
                var gameObject: GameObject | null = this.gameObject;
                var skeletonComponent: SkeletonComponent | null = null;
                while (gameObject && !skeletonComponent)
                {
                    skeletonComponent = gameObject.getComponent(SkeletonComponent)
                    gameObject = gameObject.parent;
                }
                this.cacheSkeletonComponent = skeletonComponent;
            }
            if (this._skinSkeleton && this.cacheSkeletonComponent)
            {
                var joints = this._skinSkeleton.joints;
                var globalMatrices = this.cacheSkeletonComponent.globalMatrices;
                for (var i = joints.length - 1; i >= 0; i--)
                {
                    this.skeletonGlobalMatriices[i] = globalMatrices[joints[i][0]];
                    if (this.initMatrix3d)
                    {
                        this.skeletonGlobalMatriices[i] = this.skeletonGlobalMatriices[i].clone()
                            .prepend(this.initMatrix3d);
                    }
                }
                return this.skeletonGlobalMatriices;
            }
            return defaultglobalMatrices();
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            renderAtomic.uniforms.u_modelMatrix = () => this.u_modelMatrix;
            renderAtomic.uniforms.u_ITModelMatrix = () => this.u_ITModelMatrix;
            //
            renderAtomic.uniforms.u_skeletonGlobalMatriices = () => this.u_skeletonGlobalMatriices;

            renderAtomic.shaderMacro.B_HAS_SKELETON_ANIMATION = true;
            renderAtomic.shaderMacro.V_NUM_SKELETONJOINT = this._skinSkeleton.joints.length;
        }

        /**
         * 销毁
         */
        dispose()
        {
            super.dispose();
        }
    }

    /**
     * 默认单位矩阵
     */
    function defaultglobalMatrices()
    {
        if (!_defaultglobalMatrices)
        {
            _defaultglobalMatrices = [];
            _defaultglobalMatrices.length = 150;
            var matrix3d = new Matrix4x4();
            for (var i = 0; i < 150; i++)
            {
                _defaultglobalMatrices[i] = matrix3d;
            }
        }
        return _defaultglobalMatrices;
    }
    var _defaultglobalMatrices: Matrix4x4[];

    export class SkinSkeleton
    {
        /**
         * [在整个骨架中的编号，骨骼名称]
         */
        @serialize()
        joints: [number, string][] = [];
        /**
         * 当前模型包含骨骼数量
         */
        @serialize()
        numJoint = 0;
    }

    export class SkinSkeletonTemp extends SkinSkeleton
    {
        /**
         * temp 解析时临时数据
         */
        cache_map: { [oldjointid: number]: number } = {};

        resetJointIndices(jointIndices: number[], skeleton: SkeletonComponent)
        {
            var len = jointIndices.length;
            for (var i = 0; i < len; i++)
            {
                if (this.cache_map[jointIndices[i]] === undefined)
                    this.cache_map[jointIndices[i]] = this.numJoint++;
                jointIndices[i] = this.cache_map[jointIndices[i]];
            }

            this.joints.length = 0;
            for (var key in this.cache_map)
            {
                if (this.cache_map.hasOwnProperty(key))
                {
                    this.joints[this.cache_map[key]] = [parseInt(key), skeleton.joints[key].name];
                }
            }
        }
    }
}