
precision mediump float;

//此处将填充宏定义
#define macros

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

#ifdef HAS_NORMAL_SAMPLER
    varying vec3 v_tangent;
    varying vec3 v_bitangent;
#endif

uniform mat4 u_cameraMatrix;

//基本颜色
uniform vec4 u_diffuse;
#ifdef HAS_DIFFUSE_SAMPLER
    uniform sampler2D s_diffuse;
#endif
#ifdef HAS_NORMAL_SAMPLER
    uniform sampler2D s_normal;
#endif

#if NUM_POINTLIGHT > 0
    #include<modules/pointLightShading.fragment>
#endif

void main(void) {

    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);
    //获取法线
    vec3 normal;
    #ifdef HAS_NORMAL_SAMPLER
        normal = texture2D(s_normal,uv).xyz * 2.0 - 1;
        normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);
    #else
        normal = normalize(v_normal);
    #endif

    //获取漫反射基本颜色
    vec4 diffuseColor = u_diffuse;
    #ifdef HAS_DIFFUSE_SAMPLER
        diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);
    #endif

    //获取镜面反射基本颜色
    vec4 specularColor = vec4(1.0,1.0,1.0,1.0);

    //获取高光值
    float glossiness = 5.0;

    //渲染灯光
    #if NUM_POINTLIGHT > 0
        finalColor.xyz = pointLightShading(normal,diffuseColor.xyz,specularColor.xyz,glossiness);
    #endif

    gl_FragColor = finalColor;
}