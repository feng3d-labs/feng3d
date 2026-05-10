#version 300 es
#define POSITION_LOCATION 0
#define TEXCOORD_LOCATION 4

precision highp float;
precision highp int;

uniform mat4 mvp;

layout(location = POSITION_LOCATION) in vec2 position;
layout(location = TEXCOORD_LOCATION) in vec2 textureCoordinates;

out vec2 v_st;

void main()
{
    v_st = textureCoordinates;
    gl_Position = mvp * vec4(position, 0.0, 1.0);
}

