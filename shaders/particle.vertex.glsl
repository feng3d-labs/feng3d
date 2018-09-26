precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;

varying vec2 v_uv;

uniform float u_PointSize;

#ifdef HAS_PARTICLE_ANIMATOR
    #include<particle_declare.vertex>
#endif

void main() 
{
    vec4 position = vec4(a_position,1.0);
    
    #ifdef HAS_PARTICLE_ANIMATOR
        position = particleAnimation(position);
    #endif

    vec3 normal = a_normal;

    //获取全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
    //输出uv
    v_uv = a_uv;

    gl_PointSize = u_PointSize;
}