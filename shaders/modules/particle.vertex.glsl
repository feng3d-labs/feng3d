//根据是否提供(a_particle_position)数据自动定义 #define D_(a_particle_position)

#ifdef D_a_particle_birthTime
    attribute float a_particle_birthTime;
#endif

#ifdef D_a_particle_position
    attribute vec3 a_particle_position;
#endif

#ifdef D_a_particle_velocity
    attribute vec3 a_particle_velocity;
#endif

#ifdef D_a_particle_lifetime
    attribute float a_particle_lifetime;
#endif

#ifdef D_a_particle_color
    attribute vec4 a_particle_color;
    varying vec4 v_particle_color;
#endif

uniform float u_particleTime;

#ifdef D_u_particle_acceleration
    uniform vec3 u_particle_acceleration;
#endif

#ifdef D_u_particle_billboardMatrix
    uniform mat4 u_particle_billboardMatrix;
#endif

vec4 particleAnimation(vec4 position) {

    #ifdef D_a_particle_birthTime
    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){

        #ifdef D_a_particle_lifetime
            pTime = mod(pTime,a_particle_lifetime);
        #endif

        vec3 pVelocity = vec3(0.0,0.0,0.0);

        #ifdef D_u_particle_billboardMatrix
            position = u_particle_billboardMatrix * position;
        #endif

        #ifdef D_a_particle_position
            position.xyz = position.xyz + a_particle_position;
        #endif

        #ifdef D_a_particle_velocity
            pVelocity = pVelocity + a_particle_velocity;
        #endif

        #ifdef D_u_particle_acceleration
            pVelocity = pVelocity + u_particle_acceleration * pTime;
        #endif
        
        #ifdef D_a_particle_color
            v_particle_color = a_particle_color;
        #endif

        position.xyz = position.xyz + pVelocity * pTime;
    }
    #endif
    
    return position;
}