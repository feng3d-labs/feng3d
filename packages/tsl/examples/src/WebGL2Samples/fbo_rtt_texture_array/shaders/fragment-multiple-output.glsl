#version 300 es

precision highp float;
precision highp int;

layout(location = 0) out vec4 red;
layout(location = 1) out vec4 green;
layout(location = 2) out vec4 blue;

void main()
{
    red = vec4(0.5, 0.0, 0.0, 1.0);
    green = vec4(0.0, 0.3, 0.0, 1.0);
    blue = vec4(0.0, 0.0, 0.8, 1.0);
}
