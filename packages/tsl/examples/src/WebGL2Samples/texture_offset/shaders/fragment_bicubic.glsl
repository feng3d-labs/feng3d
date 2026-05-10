#version 300 es
precision highp float;
precision highp int;

uniform sampler2D diffuse;

in vec2 v_st;

out vec4 color;

void main()
{
    ivec2 size = textureSize(diffuse, 0);
    ivec2 texelCoord = ivec2(v_st * vec2(size));
    vec4 texel00 = texelFetchOffset(diffuse, texelCoord, 0, ivec2(-1, -1));
    vec4 texel10 = texelFetchOffset(diffuse, texelCoord, 0, ivec2(0, -1));
    vec4 texel01 = texelFetchOffset(diffuse, texelCoord, 0, ivec2(-1, 0));
    vec4 texel11 = texelFetchOffset(diffuse, texelCoord, 0, ivec2(0, 0));
    color = (texel00 + texel10 + texel01 + texel11) * 0.25;
}

