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
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    #endif

    #if DIFFUSE_INPUT_TYPE == 1
        gl_FragColor = u_diffuseInput;
    #endif

    #if DIFFUSE_INPUT_TYPE == 2
        gl_FragColor = texture2D(s_texture, v_uv);
    #endif

}