precision mediump float;  

//此处将填充宏定义
#define macros

attribute vec3 a_position;
attribute vec4 a_color;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#ifdef HAS_SKELETON_ANIMATION
    #include<modules/skeleton.vertex>
#endif

#ifdef HAS_PARTICLE_ANIMATOR
    #include<modules/particle.vertex>
#endif

void main(void) {

    vec4 position = vec4(a_position,1.0);

    #ifdef HAS_SKELETON_ANIMATION
        position = skeletonAnimation(position);
    #endif

    #ifdef HAS_PARTICLE_ANIMATOR
        position = particleAnimation(position);
    #endif

    gl_Position = u_viewProjection * u_modelMatrix * position;
}