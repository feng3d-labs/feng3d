precision mediump float;

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

attribute float a_particle_birthTime;
attribute vec3 a_particle_position;
attribute vec3 a_particle_velocity;

uniform float u_particleTime;

void main(void) {

    vec3 position = a_position;

    position = position + a_particle_position;
    
    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){
        position = position + a_particle_velocity * pTime;
    }else{
        position = vec3(0.0,0.0,0.0);
    }
    
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
    gl_PointSize = 1.0;
}