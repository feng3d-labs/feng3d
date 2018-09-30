#ifdef HAS_PARTICLE_ANIMATOR
    varying vec4 v_particle_color;

    vec4 particleAnimation(vec4 color) {

        return color * v_particle_color;
    }
#endif