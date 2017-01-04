precision mediump float;

#if DIFFUSE_INPUT_TYPE == 1
    uniform vec4 u_diffuseInput;
#endif

#if DIFFUSE_INPUT_TYPE == 2
    uniform sampler2D s_texture;
    varying vec2 v_uv;
#endif

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

    gl_FragColor = finalColor;
}