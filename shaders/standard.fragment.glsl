
precision mediump float;

//此处将填充宏定义
#define macros

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

uniform mat4 u_cameraMatrix;

//基本颜色
uniform vec4 u_diffuse;
#ifdef HAS_DIFFUSE_SAMPLER
    uniform sampler2D s_diffuse;
#endif
#if NUM_POINTLIGHT > 0
    #include<modules/pointLightShading.fragment>
#endif

void main(void) {

    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);
    vec3 normal = normalize(v_normal);

    vec4 diffuseColor = u_diffuse;
    #ifdef HAS_DIFFUSE_SAMPLER
        diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);
    #endif

    //渲染灯光
    #if NUM_POINTLIGHT > 0
        finalColor.xyz = pointLightShading(normal,diffuseColor.xyz);
    #endif

    gl_FragColor = finalColor;
}