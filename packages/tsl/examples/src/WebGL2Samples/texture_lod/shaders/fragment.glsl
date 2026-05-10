#version 300 es
#define FRAG_COLOR_LOCATION 0

precision highp float;
precision highp int;

uniform sampler2D diffuse;
uniform float lodBias;

in vec2 v_st;

layout(location = FRAG_COLOR_LOCATION) out vec4 color;

void main()
{
    color = texture(diffuse, v_st, lodBias);
}

