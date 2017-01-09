attribute vec3 a_position;
attribute vec3 a_particlePosition;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

void main(void) {

    vec3 position = a_position + a_particlePosition;
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
}