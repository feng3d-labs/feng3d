#ifdef HAS_SKELETON_ANIMATION

    attribute vec4 a_skinIndices;
    attribute vec4 a_jointweight0;

    #ifdef HAS_a_jointindex1
        attribute vec4 a_jointindex1;
        attribute vec4 a_jointweight1;
    #endif

    #ifdef NUM_SKELETONJOINT
        uniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];
    #endif

    vec4 skeletonAnimation(vec4 position) 
    {
        vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
        for(int i = 0; i < 4; i++)
        {
            totalPosition += u_skeletonGlobalMatriices[int(a_skinIndices[i])] * position * a_jointweight0[i];
        }
        #ifdef HAS_a_jointindex1
            for(int i = 0; i < 4; i++)
            {
                totalPosition += u_skeletonGlobalMatriices[int(a_jointindex1[i])] * position * a_jointweight1[i];
            }
        #endif
        position.xyz = totalPosition.xyz;
        return position;
    }
#endif