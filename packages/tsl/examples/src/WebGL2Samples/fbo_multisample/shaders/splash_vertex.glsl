#version 300 es
precision highp float;
precision highp int;

uniform mat4 MVP;

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 texcoord;

out vec2 uv;

void main()
{
    uv = texcoord;
    gl_Position = MVP * vec4(position, 0.0, 1.0);
}
