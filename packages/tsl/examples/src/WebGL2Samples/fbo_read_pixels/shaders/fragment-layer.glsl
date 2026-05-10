#version 300 es

precision highp float;
precision highp int;
precision lowp sampler2DArray;

uniform sampler2DArray diffuse;
uniform int layer;

in vec2 v_st;

out vec4 color;

void main()
{
    color = texture(diffuse, vec3(v_st, float(layer)));
}
