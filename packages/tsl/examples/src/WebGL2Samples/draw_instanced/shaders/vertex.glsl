#version 300 es
#define POSITION_LOCATION 0
#define COLOR_LOCATION 1
        
precision highp float;
precision highp int;

layout(location = POSITION_LOCATION) in vec2 pos;
layout(location = COLOR_LOCATION) in vec4 color;
flat out vec4 v_color;

void main()
{
    v_color = color;
    gl_Position = vec4(pos + vec2(float(gl_InstanceID) - 0.5, 0.0), 0.0, 1.0);
}
