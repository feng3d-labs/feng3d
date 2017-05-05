attribute vec4 a_jointindex0;
attribute vec4 a_jointweight0;

attribute vec4 a_jointindex1;
attribute vec4 a_jointweight1;
uniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];

vec4 skeletonAnimation(vec4 position) {

    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
    for(int i = 0; i < 4; i++){
        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex0[i])] * position * a_jointweight0[i];
    }
    for(int i = 0; i < 4; i++){
        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex1[i])] * position * a_jointweight1[i];
    }
    position.xyz = totalPosition.xyz;
    return position;
}