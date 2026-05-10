#version 300 es
#define POSITION_LOCATION 0

precision highp float;
precision highp int;

layout(std140, column_major) uniform;

uniform Transform
{
    mat4 MVP[2];
} transform;

layout(location = POSITION_LOCATION) in vec2 pos;
flat out int instance;

void main()
{
    instance = gl_InstanceID;
    gl_Position = transform.MVP[gl_InstanceID] * vec4(pos, 0.0, 1.0);
}
