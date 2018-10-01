precision mediump float;  

#include<attribute_pars_vert>
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
    #include<attribute_vert>
    // 动画
    #include<skeleton_vert>
    #include<particle_vert>
    // 投影
    #include<worldposition_vert>
    #include<project_vert>
    // 
    #include<uv_vert>
    #include<normalmap_vert>
    //
    #include<lights_vert>
    #include<pointsize_vert>
}