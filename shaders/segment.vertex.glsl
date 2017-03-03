

attribute vec3 a_position;
attribute vec4 a_color;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec4 v_color;

void main(void) {
    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);
    v_color = a_color;
}