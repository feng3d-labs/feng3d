#version 300 es
precision mediump float;

in vec3 a_position;
in vec2 a_uv;

in vec3 a_jointindex;
in vec3 a_jointweight;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

out vec2 v_uv;

void main(void) {

    int jointIndics[8];
    // jointIndics[0] = int(a_jointindex.x % 10000.0);
    // jointIndics[0] = 0;
    int ii = 111 % 10000;
    // int ii = int(a_jointindex.x) % 10000;
    // jointIndics[1] = int(a_jointindex.x) / 10000;
    // jointIndics[1] = int(a_jointindex.x) / 10000;
    // jointIndics[2] = int(a_jointindex.y % 10000.0);
    // jointIndics[3] = int(a_jointindex.y) / 10000;
    // jointIndics[4] = int(a_jointindex.z % 10000.0);
    // jointIndics[5] = int(a_jointindex.z) / 10000;
    // jointIndics[6] = int(a_jointindex.w % 10000.0);
    // jointIndics[7] = int(a_jointindex.w) / 10000;

    float jointweights[8];

    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
     v_uv = a_uv;
}