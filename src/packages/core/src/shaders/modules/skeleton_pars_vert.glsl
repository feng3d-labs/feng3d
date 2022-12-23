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