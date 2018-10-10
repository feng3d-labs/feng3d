#ifdef HAS_PARTICLE_ANIMATOR
    //
    attribute vec3 a_particle_position;
    attribute vec3 a_particle_scale;
    attribute vec4 a_particle_color;

    uniform mat4 u_particle_billboardMatrix;

    varying vec4 v_particle_color;

    vec4 particleAnimation(vec4 position) 
    {
        position.xyz = position.xyz * a_particle_scale;

        // 位移
        position = u_particle_billboardMatrix * position;

        position.xyz = position.xyz + a_particle_position;

        // 颜色
        v_particle_color = a_particle_color;
        
        return position;
    }
#endif