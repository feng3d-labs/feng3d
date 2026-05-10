#version 300 es

precision highp float;
precision highp int;

layout(location = 0) out vec4 color1;
layout(location = 1) out vec4 color2;

void main()
{
    color1 = vec4(1.0, 0.0, 0.0, 1.0);
    color2 = vec4(0.0, 0.0, 1.0, 1.0);
}
