#ifdef HAS_PARTICLE_ANIMATOR
    //
    attribute float a_particle_birthTime;
    attribute vec3 a_particle_position;
    attribute vec3 a_particle_velocity;
    attribute vec3 a_particle_acceleration;
    attribute float a_particle_lifetime;
    attribute vec4 a_particle_color;

    uniform float u_particleTime;
    uniform mat4 u_particle_billboardMatrix;

    varying vec4 v_particle_color;

    vec4 particleAnimation(vec4 position) 
    {
        float pTime = u_particleTime - a_particle_birthTime;

        // 当前时间
        pTime = mod(pTime,a_particle_lifetime);

        // 加速度
        vec3 acceleration = a_particle_acceleration;

        // 速度
        vec3 pVelocity = a_particle_velocity;
        pVelocity = pVelocity + acceleration * pTime;

        // 位移
        position = u_particle_billboardMatrix * position;
        position.xyz = position.xyz + a_particle_position;
        position.xyz = position.xyz + pVelocity * pTime;

        // 颜色
        v_particle_color = a_particle_color;
        
        return position;
    }
#endif