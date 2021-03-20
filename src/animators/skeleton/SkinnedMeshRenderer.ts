namespace feng3d
{
    export interface ComponentMap { SkinnedMeshRenderer: SkinnedMeshRenderer }

    @RegisterComponent({ single: true })
    export class SkinnedMeshRenderer extends Renderable
    {
        __class__: "feng3d.SkinnedMeshRenderer";

        @serialize
        @oav()
        skinSkeleton: SkinSkeleton;

        @serialize
        initMatrix: Matrix4x4;

        /**
		 * 创建一个骨骼动画类
		 */
        init()
        {
            super.init();
            this.hideFlags = HideFlags.DontTransform;
        }

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            super.beforeRender(renderAtomic, scene, camera);

            var frameId: string = null;
            var animation = this.getComponentsInParents(Animation)[0];
            if (animation)
            {
                frameId = animation.clipName + "&" + animation.frame;
            }

            renderAtomic.uniforms.u_modelMatrix = () => this.u_modelMatrix;
            renderAtomic.uniforms.u_ITModelMatrix = () => this.u_ITModelMatrix;
            //
            var skeletonGlobalMatriices = this.cacheU_skeletonGlobalMatriices[frameId];
            if (!skeletonGlobalMatriices)
            {
                skeletonGlobalMatriices = this.u_skeletonGlobalMatriices;
                if (frameId) this.cacheU_skeletonGlobalMatriices[frameId] = skeletonGlobalMatriices;
            }
            renderAtomic.uniforms.u_skeletonGlobalMatriices = skeletonGlobalMatriices;

            renderAtomic.shaderMacro.HAS_SKELETON_ANIMATION = true;
            renderAtomic.shaderMacro.NUM_SKELETONJOINT = this.skinSkeleton.joints.length;
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.cacheSkeletonComponent = null;
            super.dispose();
        }

        /**
         * 缓存，通过寻找父结点获得
         */
        private cacheSkeletonComponent: SkeletonComponent;

        private cacheU_skeletonGlobalMatriices: { [id: string]: Matrix4x4[] } = {};

        private get u_modelMatrix()
        {
            if (this.cacheSkeletonComponent)
                return this.cacheSkeletonComponent.node3d.localToWorldMatrix;
            return this.node3d.localToWorldMatrix
        }

        private get u_ITModelMatrix()
        {
            if (this.cacheSkeletonComponent)
                return this.cacheSkeletonComponent.node3d.ITlocalToWorldMatrix;
            return this.node3d.ITlocalToWorldMatrix
        }

        private get u_skeletonGlobalMatriices() 
        {
            if (!this.cacheSkeletonComponent)
            {
                var node3d = this.node3d;
                var skeletonComponent: SkeletonComponent = null;
                while (node3d && !skeletonComponent)
                {
                    skeletonComponent = node3d.getComponent(SkeletonComponent)
                    node3d = node3d.parent;
                }
                this.cacheSkeletonComponent = skeletonComponent;
            }
            var skeletonGlobalMatriices: Matrix4x4[] = [];
            if (this.skinSkeleton && this.cacheSkeletonComponent)
            {
                var joints = this.skinSkeleton.joints;
                var globalMatrices = this.cacheSkeletonComponent.globalMatrices;
                for (var i = joints.length - 1; i >= 0; i--)
                {
                    skeletonGlobalMatriices[i] = globalMatrices[joints[i][0]].clone();
                    if (this.initMatrix)
                    {
                        skeletonGlobalMatriices[i].prepend(this.initMatrix);
                    }
                }
            } else
            {
                skeletonGlobalMatriices = defaultSkeletonGlobalMatriices;
            }
            return skeletonGlobalMatriices;
        }
    }

    var defaultSkeletonGlobalMatriices: Matrix4x4[] = (() => { var v = [new Matrix4x4()]; var i = 150; while (i-- > 1) v.push(v[0]); return v; })();

    export class SkinSkeleton
    {
        /**
         * [在整个骨架中的编号，骨骼名称]
         */
        @serialize
        joints: [number, string][] = [];
        /**
         * 当前模型包含骨骼数量
         */
        @serialize
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