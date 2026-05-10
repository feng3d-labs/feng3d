#version 300 es
#define POSITION_LOCATION 0
#define TEXCOORD_LOCATION 4

precision highp float;
precision highp int;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

layout(location = POSITION_LOCATION) in vec3 position;
layout(location = TEXCOORD_LOCATION) in vec2 texcoord;

out vec2 v_uv;
out vec3 v_position;

void main()
{
    v_uv = texcoord;
    v_position = vec3(mvMatrix * vec4(position, 1.0));
    gl_Position = pMatrix * mvMatrix * vec4(position, 1.0);
}

