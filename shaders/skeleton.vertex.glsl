#version 300 es
precision mediump float;

//此处将填充宏定义
#define macros

in vec3 a_position;
in vec2 a_uv;

in vec4 a_jointindex0;
in vec4 a_jointweight0;

in vec4 a_jointindex1;
in vec4 a_jointweight1;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

uniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];

out vec2 v_uv;

void main(void) {

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

    vec4 position = vec4(a_position,1.0);
    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
    for(int i = 0; i < 8; i++){

        totalPosition += u_skeletonGlobalMatriices[jointIndics[i]] * position * jointweights[i];

        // totalPosition.x += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3]) * jointweights[i];
        // totalPosition.y += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3 + 1]) * jointweights[i];
        // totalPosition.z += dot(position, u_skeletonGlobalMatriices[jointIndics[i] * 3 + 2]) * jointweights[i];
    }
    position = totalPosition;
    position.w = 1.0;

    vec4 globalPosition = u_modelMatrix * position;
    gl_Position = u_viewProjection * globalPosition;
    v_uv = a_uv;
}