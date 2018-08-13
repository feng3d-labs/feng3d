precision mediump float;  

attribute vec3 a_position;
attribute vec4 a_color;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#include<skeleton.vertex>

void main() {

    vec4 position = vec4(a_position,1.0);

    position = skeletonAnimation(position);

    #ifdef HAS_PARTICLE_ANIMATOR
        position = particleAnimation(position);
    #endif

    gl_Position = u_viewProjection * u_modelMatrix * position;
}