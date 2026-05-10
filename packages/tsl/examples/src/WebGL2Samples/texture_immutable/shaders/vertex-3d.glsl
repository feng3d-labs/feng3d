#version 300 es
#define POSITION_LOCATION 0
#define TEXCOORD_LOCATION 4

precision highp float;
precision highp int;

layout(location = POSITION_LOCATION) in vec2 position;
layout(location = TEXCOORD_LOCATION) in vec2 in_texcoord;

// Output 3D texture coordinate after transformation
out vec3 v_texcoord;

void main()
{
    // Multiply the texture coordinate by the transformation
    // matrix to place it into 3D space
    v_texcoord = (mat4(1.0) * vec4(in_texcoord - vec2(0.5, 0.5), 0.5, 1.0)).stp;
    gl_Position = vec4(position, 0.0, 1.0);
}

