#version 300 es

in vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

void main(void) {
    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);
}