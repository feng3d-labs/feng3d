export default `precision mediump float;  

attribute vec3 a_position;
attribute vec4 a_color;

#include<uv_pars_vert>

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#include<skeleton_pars_vert>
#include<particle_pars_vert>

void main() 
{
    vec4 position = vec4(a_position, 1.0);

    #include<uv_vert>

    #include<skeleton_vert>
    #include<particle_vert>

    gl_Position = u_viewProjection * u_modelMatrix * position;
}`;
