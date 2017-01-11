attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

attribute vec3 a_particle_position;
attribute vec3 a_particle_velocity;

uniform float u_particleTime;

void main(void) {

    vec3 position = a_position;

    position = position + a_particle_position;
    
    position = position + a_particle_velocity * u_particleTime;
    
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
    gl_PointSize = 1.0;
}