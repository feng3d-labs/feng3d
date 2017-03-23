

//此处将填充宏定义
#define macros

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

#ifdef HAS_NORMAL_SAMPLER
    attribute vec3 a_tangent;
#endif

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

#ifdef HAS_NORMAL_SAMPLER
    varying vec3 v_tangent;
    varying vec3 v_bitangent;
#endif

void main(void) {

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出全局坐标
    v_globalPosition = globalPosition.xyz;
    //输出uv
    v_uv = a_uv;

    //计算法线
    v_normal = normalize((u_modelMatrix * vec4(a_normal,1.0)).xyz - u_modelMatrix[3].xyz);
    #ifdef HAS_NORMAL_SAMPLER
        v_tangent = normalize((u_modelMatrix * vec4(a_tangent,1.0)).xyz - u_modelMatrix[3].xyz);
        v_bitangent = cross(v_normal,v_tangent);
    #endif
}