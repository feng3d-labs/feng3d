

//此处将填充宏定义
#define macros

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

void main(void) {

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出全局坐标
    v_globalPosition = globalPosition.xyz;
    //输出uv
    v_uv = a_uv;
    //输出法线，此处待处理
    v_normal = a_normal;
}