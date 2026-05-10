#version 300 es
precision highp float;
precision highp int;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

layout(location = 0) in vec3 position;
layout(location = 4) in vec2 texcoord;

out vec2 v_uv;
out vec3 vPosition;

void main()
{
    v_uv = texcoord;
    vPosition = vec3(mvMatrix * vec4(position, 1.0));
    gl_Position = pMatrix * mvMatrix * vec4(position, 1.0);
}

