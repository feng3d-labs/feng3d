// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
#ifdef HAS_SKELETON_ANIMATION

    attribute vec4 a_skinIndices;
    attribute vec4 a_skinWeights;

    #ifdef HAS_a_skinIndices1
        attribute vec4 a_skinIndices1;
        attribute vec4 a_skinWeights1;
    #endif

    #ifdef NUM_SKELETONJOINT
        uniform mat4 u_skeletonGlobalMatrices[NUM_SKELETONJOINT];
    #endif

    vec4 skeletonAnimation(vec4 position) 
    {
        vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
        for(int i = 0; i < 4; i++)
        {
            totalPosition += u_skeletonGlobalMatrices[int(a_skinIndices[i])] * position * a_skinWeights[i];
        }
        #ifdef HAS_a_skinIndices1
            for(int i = 0; i < 4; i++)
            {
                totalPosition += u_skeletonGlobalMatrices[int(a_skinIndices1[i])] * position * a_skinWeights1[i];
            }
        #endif
        position.xyz = totalPosition.xyz;
        return position;
    }
#endif