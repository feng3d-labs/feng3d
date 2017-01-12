precision mediump float;

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

attribute float a_particle_birthTime;
attribute vec3 a_particle_position;
attribute vec3 a_particle_velocity;
attribute vec4 a_particle_color;

uniform float u_particleTime;
uniform vec3 u_particleAcceleration;

varying vec4 v_particle_color;

void main(void) {

    vec3 position = a_position;

    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){

        position = position + a_particle_position;

        vec3 velocity = a_particle_velocity;

        velocity = velocity + u_particleAcceleration * pTime;
        
        position = position + velocity * pTime;
    }
    
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
    gl_PointSize = 1.0;

    v_particle_color = a_particle_color;
}