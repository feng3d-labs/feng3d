attribute vec4 a_jointindex0;
attribute vec4 a_jointweight0;

attribute vec4 a_jointindex1;
attribute vec4 a_jointweight1;
uniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];

vec4 skeletonAnimation(vec4 position) {

    int jointIndics[8];
    jointIndics[0] = int(a_jointindex0.x);
    jointIndics[1] = int(a_jointindex0.y);
    jointIndics[2] = int(a_jointindex0.z);
    jointIndics[3] = int(a_jointindex0.w);
    jointIndics[4] = int(a_jointindex1.x);
    jointIndics[5] = int(a_jointindex1.y);
    jointIndics[6] = int(a_jointindex1.z);
    jointIndics[7] = int(a_jointindex1.w);

    float jointweights[8];
    jointweights[0] = a_jointweight0.x;
    jointweights[1] = a_jointweight0.y;
    jointweights[2] = a_jointweight0.z;
    jointweights[3] = a_jointweight0.w;
    jointweights[4] = a_jointweight1.x;
    jointweights[5] = a_jointweight1.y;
    jointweights[6] = a_jointweight1.z;
    jointweights[7] = a_jointweight1.w;

    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
    for(int i = 0; i < 8; i++){

        totalPosition += u_skeletonGlobalMatriices[jointIndics[i]] * position * jointweights[i];
    }
    position.xyz = totalPosition.xyz;
    return position;
}