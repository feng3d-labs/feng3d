#version 300 es
#define POSITION_LOCATION 1
#define TEXCOORD_LOCATION 2
#define NORMAL_LOCATION 3
#define COLOR_LOCATION 4
#define LIGHT_DIRECTION_LOCATION 5

precision highp float;
precision highp int;

uniform sampler2D s_tex2D;
uniform float u_ambient;

in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_lightDirection;
out vec4 color;

void main()
{
    color = texture(s_tex2D, v_texCoord);

    float lightIntensity = dot(normalize(v_normal), normalize(v_lightDirection));
    lightIntensity = clamp(lightIntensity, 0.0, 1.0) + u_ambient;

    color = color * lightIntensity;
}

