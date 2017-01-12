precision mediump float;

varying vec4 v_particle_color;

void main(void) {
   
    gl_FragColor = vec4(1.0,1.0,1.0,1.0);
    gl_FragColor = v_particle_color;
}
