// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;

varying vec2 v_uv;

uniform vec4 _TintColor;
uniform sampler2D _MainTex;
uniform vec4 _MainTex_ST;

#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);

    #include<particle_frag>

    vec2 uv = v_uv;
    uv = uv * _MainTex_ST.xy + _MainTex_ST.zw;
    finalColor = 2.0 * finalColor * _TintColor * texture2D(_MainTex, uv);

    gl_FragColor = finalColor;
}