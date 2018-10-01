precision mediump float;  

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#include<skeleton_pars_vert>
#include<particle_pars_vert>

varying vec3 v_worldPosition;

void main() 
{
    vec4 position = vec4(a_position, 1.0);

    #include<skeleton_vert>
    #include<particle_vert>

    vec4 worldPosition = u_modelMatrix * position;
    gl_Position = u_viewProjection * worldPosition;
    v_worldPosition = worldPosition.xyz;
}