#version 300 es

in vec3 a_position;
in vec4 a_color;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

out vec4 v_color;

void main(void) {
    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);
    v_color = a_color;
}