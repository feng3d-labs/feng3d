attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec3 v_worldPosition;

void main() {

    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * worldPosition;
    v_worldPosition = worldPosition.xyz;
}