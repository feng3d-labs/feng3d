#version 300 es
precision highp float;
precision highp int;

uniform mat4 mvp;

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 textureCoordinates;

out vec2 v_st;

void main()
{
    v_st = textureCoordinates;
    gl_Position = mvp * vec4(position, 0.0, 1.0);
}
