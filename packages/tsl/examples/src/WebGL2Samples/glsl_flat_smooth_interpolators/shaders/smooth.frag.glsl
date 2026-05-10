#version 300 es

precision highp float;
precision highp int;

in vec3 v_normal;

layout(location = 0) out vec4 color;

void main()
{
    color = vec4(v_normal, 1.0);
}
