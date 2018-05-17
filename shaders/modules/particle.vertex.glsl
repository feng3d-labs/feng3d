attribute float a_particle_birthTime;
attribute vec3 a_particle_position;
attribute vec3 a_particle_velocity;
attribute float a_particle_lifetime;
attribute vec4 a_particle_color;

varying vec4 v_particle_color;

uniform float u_particleTime;
uniform vec3 u_particle_acceleration;
uniform mat4 u_particle_billboardMatrix;

vec4 particleAnimation(vec4 position) {

    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){

        pTime = mod(pTime,a_particle_lifetime);

        vec3 pVelocity = vec3(0.0,0.0,0.0);

        position = u_particle_billboardMatrix * position;
        position.xyz = position.xyz + a_particle_position;
        pVelocity = pVelocity + a_particle_velocity;
        pVelocity = pVelocity + u_particle_acceleration * pTime;
        v_particle_color = a_particle_color;

        position.xyz = position.xyz + pVelocity * pTime;
    }
    
    return position;
}