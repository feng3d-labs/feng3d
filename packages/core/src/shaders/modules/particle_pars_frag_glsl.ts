export default `#ifdef HAS_PARTICLE_ANIMATOR
    varying vec4 v_particle_color;

    vec4 particleAnimation(vec4 color) {

        color.xyz = color.xyz * v_particle_color.xyz;
        color.xyz = color.xyz * v_particle_color.www;
        return color;
    }
#endif`;
