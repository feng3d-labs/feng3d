#version 300 es
#define POSITION_LOCATION 0
#define TEXCOORD_LOCATION 4

precision highp float;
precision highp int;

uniform mat4 mvp;

layout(location = POSITION_LOCATION) in vec2 position;
layout(location = TEXCOORD_LOCATION) in vec2 textureCoordinates;

out vec2 v_st;
out vec2 v_blurTexCoords[14];
out vec2 h_blurTexCoords[14];

void main()
{
    v_st = textureCoordinates;
    gl_Position = mvp * vec4(position, 0.0, 1.0) ;
    v_blurTexCoords[ 0] = v_st + vec2(0.0, -0.050);
    v_blurTexCoords[ 1] = v_st + vec2(0.0, -0.036);
    v_blurTexCoords[ 2] = v_st + vec2(0.0, -0.020);
    v_blurTexCoords[ 3] = v_st + vec2(0.0, -0.016);
    v_blurTexCoords[ 4] = v_st + vec2(0.0, -0.012);
    v_blurTexCoords[ 5] = v_st + vec2(0.0, -0.008);
    v_blurTexCoords[ 6] = v_st + vec2(0.0, -0.004);
    v_blurTexCoords[ 7] = v_st + vec2(0.0,  0.004);
    v_blurTexCoords[ 8] = v_st + vec2(0.0,  0.008);
    v_blurTexCoords[ 9] = v_st + vec2(0.0,  0.012);
    v_blurTexCoords[10] = v_st + vec2(0.0,  0.016);
    v_blurTexCoords[11] = v_st + vec2(0.0,  0.020);
    v_blurTexCoords[12] = v_st + vec2(0.0,  0.036);
    v_blurTexCoords[13] = v_st + vec2(0.0,  0.050);

    h_blurTexCoords[ 0] = v_st + vec2(-0.050, 0.0);
    h_blurTexCoords[ 1] = v_st + vec2(-0.036, 0.0);
    h_blurTexCoords[ 2] = v_st + vec2(-0.020, 0.0);
    h_blurTexCoords[ 3] = v_st + vec2(-0.016, 0.0);
    h_blurTexCoords[ 4] = v_st + vec2(-0.012, 0.0);
    h_blurTexCoords[ 5] = v_st + vec2(-0.008, 0.0);
    h_blurTexCoords[ 6] = v_st + vec2(-0.004, 0.0);
    h_blurTexCoords[ 7] = v_st + vec2( 0.004, 0.0);
    h_blurTexCoords[ 8] = v_st + vec2( 0.008, 0.0);
    h_blurTexCoords[ 9] = v_st + vec2( 0.012, 0.0);
    h_blurTexCoords[10] = v_st + vec2( 0.016, 0.0);
    h_blurTexCoords[11] = v_st + vec2( 0.020, 0.0);
    h_blurTexCoords[12] = v_st + vec2( 0.036, 0.0);
    h_blurTexCoords[13] = v_st + vec2( 0.050, 0.0);
}
