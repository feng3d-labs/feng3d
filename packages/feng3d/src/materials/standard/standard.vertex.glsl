// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;  

#include<position_pars_vert>
#include<normal_pars_vert>
#include<tangent_pars_vert>
#include<color_pars_vert>
//
#include<skeleton_pars_vert>
#include<particle_pars_vert>
//
#include<worldposition_pars_vert>
#include<project_pars_vert>
//
#include<uv_pars_vert>
#include<normalmap_pars_vert>
//
#include<lights_pars_vert>
#include<pointsize_pars_vert>

void main()
{
    // 初始化
    #include<position_vert>
    #include<normal_vert>
    #include<tangent_vert>
    #include<color_vert>
    #include<uv_vert>
    // 动画
    #include<skeleton_vert>
    #include<particle_vert>
    // 投影
    #include<worldposition_vert>
    #include<project_vert>
    // 
    #include<normalmap_vert>
    //
    #include<lights_vert>
    #include<pointsize_vert>
}