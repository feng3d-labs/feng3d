#version 300 es

precision highp float;
precision highp int;

uniform sampler2D depthMap;

in vec2 v_st;

out vec4 color;

void main()
{
    vec3 depth = vec3(texture(depthMap, v_st).r);
    color = vec4(1.0 - depth, 1.0);
}
