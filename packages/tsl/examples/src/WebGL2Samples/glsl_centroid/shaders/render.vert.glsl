#version 300 es
#define POSITION_LOCATION 0
#define ATTRIBUTE_DATA_LOCATION 6

precision highp float;
precision highp int;

uniform mat4 MVP;

layout(location = POSITION_LOCATION) in vec2 position;
layout(location = ATTRIBUTE_DATA_LOCATION) in float data;

out float v_attribute;

void main()
{
    gl_Position = MVP * vec4(position, 0.0, 1.0);
    v_attribute = data;
}
