precision mediump float;  

//此处将填充宏定义
#define macros

//坐标属性
attribute vec3 a_position;
#ifdef HSA_a_uv
    attribute vec2 a_uv;
#endif
#ifdef HSA_a_normal
    attribute vec3 a_normal;
#endif

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;
uniform float u_scaleByDepth;

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

#ifdef HAS_NORMAL_SAMPLER
    attribute vec3 a_tangent;

    varying vec3 v_tangent;
    varying vec3 v_bitangent;
#endif

#ifdef HAS_SKELETON_ANIMATION
    #include<modules/skeleton.vertex>
#endif

#ifdef IS_POINTS_MODE
    uniform float u_PointSize;
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

    #ifdef HSA_a_normal
        vec3 normal = a_normal;
    #else
        vec3 normal = vec3(0.0,1.0,0.0);
    #endif

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出全局坐标
    v_globalPosition = globalPosition.xyz;
    #ifdef HSA_a_uv
    //输出uv
        v_uv = a_uv;
    #else
        v_uv = vec2(0.0,0.0);
    #endif

    //计算法线
    v_normal = normalize((u_ITModelMatrix * vec4(normal,0.0)).xyz);
    #ifdef HAS_NORMAL_SAMPLER
        v_tangent = normalize((u_modelMatrix * vec4(a_tangent,0.0)).xyz);
        v_bitangent = cross(v_normal,v_tangent);
    #endif
    
    #ifdef IS_POINTS_MODE
        gl_PointSize = u_PointSize;
    #endif
}