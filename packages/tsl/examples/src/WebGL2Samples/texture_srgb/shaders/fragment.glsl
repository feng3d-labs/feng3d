#version 300 es
#define FRAG_COLOR_LOCATION 0

precision highp float;
precision highp int;

uniform sampler2D materialDiffuse;

in vec2 v_blurTexCoords[14];
in vec2 h_blurTexCoords[14];

in vec2 v_st;

layout(location = FRAG_COLOR_LOCATION) out vec4 color;

vec3 rgbToSrgb(in vec3 colorRGB, in float gammaCorrection)
{
    vec3 clampedColorRGB = clamp(colorRGB, 0.0, 1.0);

    return mix(
        pow(clampedColorRGB, vec3(gammaCorrection)) * 1.055 - 0.055,
        clampedColorRGB * 12.92,
        lessThan(clampedColorRGB, vec3(0.0031308)));
}

// For all settings: 1.0 = 100% 0.5=50% 1.5 = 150%
vec3 contrastSaturationBrightness(vec3 color, float brt, float sat, float con)
{
    const vec3 lumCoeff = vec3(0.2125, 0.7154, 0.0721);

    vec3 brtColor = color * brt;
    vec3 intensity = vec3(dot(brtColor, lumCoeff));
    vec3 satColor = mix(intensity, brtColor, sat);
    vec3 conColor = mix(vec3(0.5), satColor, con);
    return conColor;
}

void main()
{
    vec2 sampleCoord = fract(v_st.xy);

    // *N.B*: Since we fetched in a sRGB texture format, fragment shader automatically converted
    // from non-linear sRGB color space to linear RGB color space for us.
    // This is useful since then we could work with the filtering math in linear space,
    // then convert back to sRGB space for the color output.
    // In this example, we will use a Gaussian filter for blurring.
    vec4 colorRgb = vec4(texture(materialDiffuse, v_st).rgb, 1.0);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 0]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 1]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 2]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 3]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 4]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 5]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 6]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 7]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 8]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[ 9]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[10]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[11]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[12]), sampleCoord.y);
    colorRgb = mix(colorRgb, texture(materialDiffuse, v_blurTexCoords[13]), sampleCoord.y);

    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 0]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 1]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 2]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 3]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 4]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 5]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 6]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 7]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 8]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[ 9]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[10]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[11]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[12]), sampleCoord.x);
    colorRgb = mix(colorRgb, texture(materialDiffuse, h_blurTexCoords[13]), sampleCoord.x);

    float brightness = 1.0;
    float saturation = 0.5;
    float contrast = 1.0;
    colorRgb = vec4(contrastSaturationBrightness(colorRgb.rgb, brightness, saturation, contrast), 1.0);
    color = vec4(rgbToSrgb(colorRgb.rgb, 0.41666).rgb, 1.0);
}
