precision mediump float;

#if DIFFUSE_INPUT_TYPE == 1
    uniform vec4 u_diffuseInput;
#endif

#if DIFFUSE_INPUT_TYPE == 2
    uniform sampler2D s_texture;
#endif

#if V_UV_NEED > 0
    varying vec2 v_uv;
#endif

#if V_GLOBAL_POSITION_NEED > 0
    varying vec3 v_globalPosition;
#endif

#if V_NORMAL_NEED > 0
    varying vec3 v_normal;
#endif

#if U_CAMERAmATRIX_NEED > 0
    uniform mat4 u_cameraMatrix;
#endif

#include<modules/pointLightShading.declare>

void main(void) {

    #if DIFFUSE_INPUT_TYPE == 0
        vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);
    #endif

    #if DIFFUSE_INPUT_TYPE == 1
        vec4 finalColor = u_diffuseInput;
    #endif

    #if DIFFUSE_INPUT_TYPE == 2
        vec4 finalColor = texture2D(s_texture, v_uv);
    #endif

    #include<modules/pointLightShading.main>

    gl_FragColor = finalColor;
}
