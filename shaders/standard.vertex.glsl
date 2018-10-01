precision mediump float;  

#include<attribute_pars_vert>
#include<worldposition_pars_vert>
#include<project_pars_vert>

uniform mat4 u_ITModelMatrix;
uniform float u_scaleByDepth;

varying vec2 v_uv;
varying vec3 v_worldPosition;

varying vec3 v_normal;
varying vec3 v_tangent;
varying vec3 v_bitangent;

#include<skeleton_pars_vert>
#include<particle_pars_vert>
#include<lights_pars_vert>
#include<pointsize_pars_vert>

void main()
{
    #include<attribute_vert>
    //
    #include<skeleton_vert>
    #include<particle_vert>

    #include<worldposition_vert>
    #include<project_vert>

    //输出uv
    v_uv = uv;

    //计算法线
    v_normal = normalize((u_ITModelMatrix * vec4(normal, 0.0)).xyz);
    v_tangent = normalize((u_modelMatrix * vec4(tangent, 0.0)).xyz);
    v_bitangent = cross(v_normal, v_tangent);

    #include<lights_vert>
    #include<pointsize_vert>
}