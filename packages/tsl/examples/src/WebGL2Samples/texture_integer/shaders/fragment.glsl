#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D diffuse;

in vec2 v_st;

out vec4 color;

void main()
{
    uvec4 intColor = texture(diffuse, v_st) / 32u * 32u;
    color = vec4(intColor) / 255.0;
}

