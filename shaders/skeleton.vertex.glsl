precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;
uniform float u_scaleByDepth;

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

attribute vec3 a_tangent;

varying vec3 v_tangent;
varying vec3 v_bitangent;

uniform float u_PointSize;

attribute vec4 a_jointindex0;
attribute vec4 a_jointweight0;

#ifdef HAS_a_jointindex1
    attribute vec4 a_jointindex1;
    attribute vec4 a_jointweight1;
#endif

uniform mat4 u_skeletonGlobalMatriices[150];

vec4 skeletonAnimation(vec4 position) {

    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
    for(int i = 0; i < 4; i++){
        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex0[i])] * position * a_jointweight0[i];
    }
    #ifdef HAS_a_jointindex1
        for(int i = 0; i < 4; i++){
            totalPosition += u_skeletonGlobalMatriices[int(a_jointindex1[i])] * position * a_jointweight1[i];
        }
    #endif
    position.xyz = totalPosition.xyz;
    return position;
}

void main(void) {

    vec4 position = vec4(a_position,1.0);

    position = skeletonAnimation(position);
    
    vec3 normal = a_normal;

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出全局坐标
    v_globalPosition = globalPosition.xyz;
    //输出uv
    v_uv = a_uv;

    //计算法线
    v_normal = normalize((u_ITModelMatrix * vec4(normal,0.0)).xyz);
    v_tangent = normalize((u_modelMatrix * vec4(a_tangent,0.0)).xyz);
    v_bitangent = cross(v_normal,v_tangent);
    
    gl_PointSize = u_PointSize;
}