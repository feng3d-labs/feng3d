precision mediump float;

#if DIFFUSE_INPUT_TYPE == 1
    uniform vec4 diffuseInput_fc_vector;
#endif

#if DIFFUSE_INPUT_TYPE == 2
    uniform sampler2D texture_fs;
    varying vec2 uv_v;
#endif

void main(void) {

    #if DIFFUSE_INPUT_TYPE == 0
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    #endif

    #if DIFFUSE_INPUT_TYPE == 1
        gl_FragColor = diffuseInput_fc_vector;
    #endif

    #if DIFFUSE_INPUT_TYPE == 2
        gl_FragColor = texture2D(texture_fs, uv_v);
    #endif

}