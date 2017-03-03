

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

void main(){

    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
}