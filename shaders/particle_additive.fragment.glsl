precision mediump float;

varying vec2 v_uv;

uniform vec4 u_tintColor;
uniform vec4 u_s_particle_transform;
uniform sampler2D s_particle;

#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);

    vec2 uv = v_uv;
    uv = uv * u_s_particle_transform.xy + u_s_particle_transform.zw;

    finalColor = 2.0 *  u_tintColor * texture2D(s_particle, v_uv);

    #include<particle_frag>

    gl_FragColor = finalColor;
}