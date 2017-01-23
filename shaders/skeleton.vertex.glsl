#version 300 es
precision mediump float;

//此处将填充宏定义
#define macros

in vec3 a_position;
in vec2 a_uv;

in vec4 a_jointindex;
in vec4 a_jointweight;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

uniform vec4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT*3];

out vec2 v_uv;

void main(void) {

    int jointIndics[8];
    jointIndics[0] = int(a_jointindex.x) % 10000;
    jointIndics[1] = int(a_jointindex.x) / 10000;
    jointIndics[2] = int(a_jointindex.y) % 10000;
    jointIndics[3] = int(a_jointindex.y) / 10000;
    jointIndics[4] = int(a_jointindex.z) % 10000;
    jointIndics[5] = int(a_jointindex.z) / 10000;
    jointIndics[6] = int(a_jointindex.w) % 10000;
    jointIndics[7] = int(a_jointindex.w) / 10000;

    float jointweights[8];
    jointweights[0] = float(int(a_jointweight.x) % 10000) / 1000.0;
    jointweights[1] = float(int(a_jointweight.x) / 10000) / 1000.0;
    jointweights[2] = float(int(a_jointweight.y) % 10000) / 1000.0;
    jointweights[3] = float(int(a_jointweight.y) / 10000) / 1000.0;
    jointweights[4] = float(int(a_jointweight.z) % 10000) / 1000.0;
    jointweights[5] = float(int(a_jointweight.z) / 10000) / 1000.0;
    jointweights[6] = float(int(a_jointweight.w) % 10000) / 1000.0;
    jointweights[7] = float(int(a_jointweight.w) / 10000) / 1000.0;

    vec4 position = vec4(a_position,1.0);
    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
    for(int i = 0; i < 8; i++){
    // for(int i = 0; i < 1; i++){
    //     jointweights[i] = 1.0;

        totalPosition.x += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3]) * jointweights[i];
        totalPosition.y += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3 + 1]) * jointweights[i];
        totalPosition.z += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3 + 2]) * jointweights[i];
    }
    // position = totalPosition;

    vec4 globalPosition = u_modelMatrix * position;
    gl_Position = u_viewProjection * globalPosition;
    v_uv = a_uv;
}