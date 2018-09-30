precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;
attribute vec3 a_tangent;

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;
uniform float u_scaleByDepth;

varying vec2 v_uv;
varying vec3 v_worldPosition;
varying vec3 v_normal;

varying vec3 v_tangent;
varying vec3 v_bitangent;

#include<skeleton_pars_vert>
#include<particle_pars_vert>
#include<lights_pars_vert>

#ifdef IS_POINTS_MODE
    uniform float u_PointSize;
#endif

void main() 
{
    vec4 position = vec4(a_position, 1.0);
    
    #include<skeleton_vert>
    #include<particle_vert>
    
    vec3 normal = a_normal;

    //获取全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
    //输出全局坐标
    v_worldPosition = worldPosition.xyz;
    //输出uv
    v_uv = a_uv;

    //计算法线
    v_normal = normalize((u_ITModelMatrix * vec4(normal, 0.0)).xyz);
    v_tangent = normalize((u_modelMatrix * vec4(a_tangent, 0.0)).xyz);
    v_bitangent = cross(v_normal, v_tangent);

    lightsVertex(worldPosition);

    #ifdef IS_POINTS_MODE
        gl_PointSize = u_PointSize;
    #endif
}