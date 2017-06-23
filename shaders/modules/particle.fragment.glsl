#ifdef D_a_particle_color
    varying vec4 v_particle_color;
#endif

vec4 particleAnimation(vec4 color) {

    #ifdef D_a_particle_color
        color = color * v_particle_color;
    #endif
    return color;
}