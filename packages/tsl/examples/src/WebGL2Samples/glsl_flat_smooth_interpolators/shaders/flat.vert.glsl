#version 300 es

precision highp float;
precision highp int;

uniform mat4 mvp;
uniform mat4 mvNormal;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

flat out vec3 v_normal;

void main()
{
    v_normal = normalize((mvNormal * vec4(normal, 0.0)).xyz);
    gl_Position = mvp * vec4(position, 1.0);
}
