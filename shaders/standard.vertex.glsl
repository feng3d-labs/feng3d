

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

#ifdef HAS_NORMAL_SAMPLER
    attribute vec3 a_tangent;
#endif

#ifdef HAS_NORMAL_SAMPLER
    varying vec3 v_tangent;
    varying vec3 v_bitangent;
#endif

#ifdef HAS_SKELETON_ANIMATION
    attribute vec4 a_jointindex0;
    attribute vec4 a_jointweight0;

    attribute vec4 a_jointindex1;
    attribute vec4 a_jointweight1;
    uniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];
#endif

void main(void) {

    
    vec4 position = vec4(a_position,1.0);
    #ifdef HAS_SKELETON_ANIMATION
        int jointIndics[8];
        jointIndics[0] = int(a_jointindex0.x);
        jointIndics[1] = int(a_jointindex0.y);
        jointIndics[2] = int(a_jointindex0.z);
        jointIndics[3] = int(a_jointindex0.w);
        jointIndics[4] = int(a_jointindex1.x);
        jointIndics[5] = int(a_jointindex1.y);
        jointIndics[6] = int(a_jointindex1.z);
        jointIndics[7] = int(a_jointindex1.w);

        float jointweights[8];
        jointweights[0] = a_jointweight0.x;
        jointweights[1] = a_jointweight0.y;
        jointweights[2] = a_jointweight0.z;
        jointweights[3] = a_jointweight0.w;
        jointweights[4] = a_jointweight1.x;
        jointweights[5] = a_jointweight1.y;
        jointweights[6] = a_jointweight1.z;
        jointweights[7] = a_jointweight1.w;

        vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);
        for(int i = 0; i < 8; i++){

            totalPosition += u_skeletonGlobalMatriices[jointIndics[i]] * position * jointweights[i];
        }
        position = totalPosition;
        position.w = 1.0;
    #endif

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出全局坐标
    v_globalPosition = globalPosition.xyz;
    //输出uv
    v_uv = a_uv;

    //计算法线
    v_normal = normalize((u_modelMatrix * vec4(a_normal,0.0)).xyz);
    #ifdef HAS_NORMAL_SAMPLER
        v_tangent = normalize((u_modelMatrix * vec4(a_tangent,0.0)).xyz);
        v_bitangent = cross(v_normal,v_tangent);
    #endif
}