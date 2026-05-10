#version 300 es
precision highp float;
precision highp int;
layout(std140) uniform;

uniform Material
{
    vec4 Diffuse[2];
} material;

flat in int instance;
out vec4 color;

void main()
{
    color = material.Diffuse[instance % 2];
}
