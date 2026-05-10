#version 300 es
precision highp float;
precision highp int;

uniform mat4x3 MVP;

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 texcoord;

out vec2 v_st;

void main()
{
    v_st = texcoord;
    gl_Position = vec4(MVP * vec4(position, 0.0, 1.0) + MVP[3], 1.0);
}
