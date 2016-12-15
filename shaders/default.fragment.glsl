precision mediump float;

#ifdef ENABLE_COLOR
    uniform vec4 diffuseInput_fc_vector;
#endif

void main(void) {

    #ifdef ENABLE_COLOR
        gl_FragColor = diffuseInput_fc_vector;
    #else
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    #endif
}