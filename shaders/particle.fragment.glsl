precision mediump float;

varying vec2 v_uv;

uniform float u_alphaThreshold;
//漫反射
uniform vec4 u_diffuse;
uniform sampler2D s_diffuse;

#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);

    //获取漫反射基本颜色
    vec4 diffuseColor = u_diffuse * texture2D(s_diffuse, v_uv);

    if(diffuseColor.w < u_alphaThreshold)
    {
        discard;
    }

    finalColor = diffuseColor;

    #include<particle_frag>

    gl_FragColor = finalColor;
}