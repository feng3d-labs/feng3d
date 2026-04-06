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