precision mediump float;

varying vec2 v_uv;

uniform vec4 u_s_particle_transform;
uniform sampler2D s_particle;

#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);

    #include<particle_frag>

    vec2 uv = v_uv;
    uv = uv * u_s_particle_transform.xy + u_s_particle_transform.zw;

    finalColor = finalColor *  texture2D(s_particle, uv) * finalColor.a;

    gl_FragColor = finalColor;
    // finalColor.a = 0.5;
    // gl_FragColor = vec4( finalColor.a,finalColor.a,finalColor.a,1.0);
}