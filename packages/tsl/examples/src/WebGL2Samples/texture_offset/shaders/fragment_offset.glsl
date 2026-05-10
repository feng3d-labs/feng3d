#version 300 es
precision highp float;
precision highp int;

uniform sampler2D diffuse;
uniform ivec2 offset;

in vec2 v_st;

out vec4 color;

void main()
{
    ivec2 textureSize = textureSize(diffuse, 0);
    vec2 offsetCoord = v_st + vec2(offset) / vec2(textureSize);
    vec4 texel00 = textureOffset(diffuse, offsetCoord, ivec2(-1, -1));
    vec4 texel10 = textureOffset(diffuse, offsetCoord, ivec2(0, -1));
    vec4 texel01 = textureOffset(diffuse, offsetCoord, ivec2(-1, 0));
    vec4 texel11 = textureOffset(diffuse, offsetCoord, ivec2(0, 0));
    color = (texel00 + texel10 + texel01 + texel11) * 0.25;
}

