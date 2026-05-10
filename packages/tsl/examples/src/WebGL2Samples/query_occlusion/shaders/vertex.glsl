#version 300 es
#define POSITION_LOCATION 0

precision highp float;
precision highp int;

layout(location = POSITION_LOCATION) in vec3 pos;

void main()
{
    gl_Position = vec4(pos, 1.0);
}
