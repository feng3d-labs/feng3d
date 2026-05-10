#version 300 es
#define POSITION_LOCATION 0
#define TEXCOORD_LOCATION 1

precision highp float;
precision highp int;

layout(location = POSITION_LOCATION) in vec2 position;
layout(location = TEXCOORD_LOCATION) in vec2 in_texcoord;

// Output 3D texture coordinate after transformation
out vec3 v_texcoord;

// Matrix to transform the texture coordinates into 3D space
uniform mat4 orientation;

void main()
{
    // Multiply the texture coordinate by the transformation
    // matrix to place it into 3D space
    v_texcoord = (orientation * vec4(in_texcoord - vec2(0.5, 0.5), 0.5, 1.0)).stp;
    gl_Position = vec4(position, 0.0, 1.0);
}

