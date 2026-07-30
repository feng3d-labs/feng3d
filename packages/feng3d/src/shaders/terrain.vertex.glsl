precision mediump float;  

#include<position_pars_vert>
#include<normal_pars_vert>
#include<tangent_pars_vert>
#include<uv_pars_vert>
//
#include<worldposition_pars_vert>
#include<project_pars_vert>
//
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
    #include<uv_vert>
    // 投影
    #include<worldposition_vert>
    #include<project_vert>
    // 
    #include<normalmap_vert>
    //
    #include<lights_vert>
    #include<pointsize_vert>
}