precision mediump float;

varying vec4 v_color;
uniform vec4 u_color;

void main(void) {
   
    gl_FragColor = v_color * u_color;
}
