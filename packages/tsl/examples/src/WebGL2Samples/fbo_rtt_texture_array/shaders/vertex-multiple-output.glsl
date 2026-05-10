#version 300 es
#define POSITION_LOCATION 0

precision highp float;
precision highp int;

uniform mat4 mvp;

layout(location = POSITION_LOCATION) in vec2 position;

void main()
{
    gl_Position = mvp * vec4(position, 0.0, 1.0);
}
