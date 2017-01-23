#version 300 es

in vec3 a_position;
in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

out vec2 v_uv;

void main(void) {

    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);

    v_uv = a_uv;
}