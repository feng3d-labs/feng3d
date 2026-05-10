#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D diffuse;

in vec2 v_st;

out vec4 color;

void main()
{
    ivec2 size = textureSize(diffuse, 0);
    vec2 texcoord = v_st * vec2(size);
    ivec2 coord = ivec2(texcoord);
    uvec4 texel = uvec4(texelFetch(diffuse, coord, 0));

    color = vec4(texel) / 255.0;
}

