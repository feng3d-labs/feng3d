// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;  

attribute vec3 a_position;

#include<uv_pars_vert>

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#include<skeleton_pars_vert>
#include<particle_pars_vert>

varying vec3 v_worldPosition;

void main() 
{
    vec4 position = vec4(a_position, 1.0);

    #include<uv_vert>

    #include<skeleton_vert>
    #include<particle_vert>

    vec4 worldPosition = u_modelMatrix * position;
    gl_Position = u_viewProjection * worldPosition;
    v_worldPosition = worldPosition.xyz;
}