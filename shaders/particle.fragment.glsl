
precision mediump float;

//此处将填充宏定义
#define macros

varying vec4 v_particle_color;



void main(void) {

    gl_FragColor = v_particle_color;
}
