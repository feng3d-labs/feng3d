// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;

varying vec2 v_uv;

#include<particle_pars_vert>

void main() 
{
    vec4 position = vec4(a_position, 1.0);
    //输出uv
    v_uv = a_uv;
    
    #include<particle_vert>

    //获取全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
}