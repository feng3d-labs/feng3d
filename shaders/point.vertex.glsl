attribute vec3 a_position;
attribute vec4 a_color;

uniform float u_PointSize;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec4 v_color;

void main(void) {

    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * worldPosition;
    gl_PointSize = u_PointSize;

    v_color = a_color;
}