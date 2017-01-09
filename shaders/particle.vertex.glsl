attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

attribute vec3 a_particlePosition;
attribute vec3 a_particleVelocity;

uniform float u_particleTime;

void main(void) {

    vec3 position = a_position;


    position = position + a_particlePosition;
    
    position = position + a_particleVelocity * u_particleTime;
    
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
}