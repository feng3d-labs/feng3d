#version 300 es
#define POSITION_LOCATION 1
#define TEXCOORD_LOCATION 2
#define NORMAL_LOCATION 3
#define COLOR_LOCATION 4

precision highp float;
precision highp int;

uniform mat4 u_model;
uniform mat4 u_modelInvTrans; // To properly transform normals to world space
uniform mat4 u_viewProj;
uniform vec3 u_lightPosition;

layout(location = POSITION_LOCATION) in vec3 a_position;
layout(location = TEXCOORD_LOCATION) in vec2 a_texCoord;
layout(location = NORMAL_LOCATION) in vec3 a_normal;

// Vertex shader outputs to fragment shader
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_lightDirection;

void main()
{
    // Compute position
    vec3 modelPosition = vec3(u_model * vec4(a_position, 1.0));
    v_lightDirection = vec3(u_viewProj * vec4(u_lightPosition - modelPosition, 1.0));
    gl_Position = u_viewProj * vec4(modelPosition, 1.0);

    v_normal = vec3(u_viewProj * u_modelInvTrans * vec4(a_normal, 0.0));

    // Pass through
    v_texCoord = a_texCoord;
}

