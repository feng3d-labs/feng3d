// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;

varying vec2 v_uv;
varying vec3 v_worldPosition;
uniform vec3 u_cameraPos;

#include<color_pars_frag>

#include<normal_pars_frag>
#include<diffuse_pars_frag>
#include<alphatest_pars_frag>

#include<ambient_pars_frag>
#include<specular_pars_frag>
#include<lights_pars_frag>

#include<envmap_pars_frag>
#include<particle_pars_frag>
#include<fog_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);

    #include<color_frag>

    #include<normal_frag>
    #include<diffuse_frag>
    #include<alphatest_frag>

    finalColor = diffuseColor;

    #include<ambient_frag>
    #include<specular_frag>
    #include<lights_frag>

    #include<envmap_frag>
    #include<particle_frag>
    #include<fog_frag>

    gl_FragColor = finalColor;
}