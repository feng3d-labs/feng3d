precision mediump float;

varying vec2 v_uv;

uniform sampler2D _MainTex;
uniform vec4 _MainTex_ST;

#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);

    #include<particle_frag>

    vec2 uv = v_uv;
    uv = uv * _MainTex_ST.xy + _MainTex_ST.zw;

    finalColor = finalColor *  texture2D(_MainTex, uv) * finalColor.a;
    gl_FragColor = finalColor;
}