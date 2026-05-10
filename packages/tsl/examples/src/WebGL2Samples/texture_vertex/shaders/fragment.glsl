#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D diffuse;

in vec2 v_st;
in vec3 v_position;

out vec4 color;

float textureLevel(in sampler2D sampler, in vec2 v_st)
{
    vec2 size = vec2(textureSize(sampler, 0));

    float levelCount = max(log2(size.x), log2(size.y));

    vec2 dx = dFdx(v_st * size);
    vec2 dy = dFdy(v_st * size);
    float d = max(dot(dx, dx), dot(dy, dy));

    d = clamp(d, 1.0, pow(2.0, (levelCount - 1.0) * 2.0));

    return 0.5 * log2(d);
}

void main()
{
    vec2 sampleCoord = fract(v_st.xy);
    float level = textureLevel(diffuse, v_st);

    // Compute LOD using gradient
    color = textureLod(diffuse, v_st, level);

    // Compute flat normal using gradient
    vec3 fdx = dFdx(v_position);
    vec3 fdy = dFdy(v_position);

    vec3 N = normalize(cross(fdx, fdy));
    color = mix(color, vec4(N, 1.0), 0.5);
}

