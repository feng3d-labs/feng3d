#version 300 es
precision highp float;
precision highp int;

uniform sampler2D diffuse;

in vec2 v_st;

out vec4 color;

void main()
{
    vec2 size = vec2(textureSize(diffuse, 0) - 1);
    vec2 texcoord = v_st * size;
    ivec2 coord = ivec2(texcoord);

    vec4 texel00 = texelFetch(diffuse, coord + ivec2(0, 0), 0);
    vec4 texel10 = texelFetch(diffuse, coord + ivec2(1, 0), 0);
    vec4 texel11 = texelFetch(diffuse, coord + ivec2(1, 1), 0);
    vec4 texel01 = texelFetch(diffuse, coord + ivec2(0, 1), 0);

    vec2 sampleCoord = fract(texcoord.xy);

    vec4 texel0 = mix(texel00, texel01, sampleCoord.y);
    vec4 texel1 = mix(texel10, texel11, sampleCoord.y);

    color = mix(texel0, texel1, sampleCoord.x);
}

