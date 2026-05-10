#version 300 es
precision highp float;
precision highp int;

layout(std140, column_major) uniform;

struct Transform
{
    mat4 P;
    mat4 MV;
    mat4 Mnormal;
};

uniform PerDraw
{
    Transform transform;
} perDraw;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec4 color;

out vec3 v_normal;
out vec3 v_view;
out vec4 v_color;

void main()
{
    vec4 pEC = perDraw.transform.MV * vec4(position, 1.0);

    v_normal = (perDraw.transform.Mnormal * vec4(normal, 0.0)).xyz;
    v_view = -pEC.xyz;
    v_color = color;

    gl_Position = perDraw.transform.P * pEC;
}
