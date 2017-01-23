#version 300 es
precision mediump float;

//此处将填充宏定义
#define macros

in vec4 v_particle_color;

out vec4 o_fragColor;

void main(void) {

    o_fragColor = v_particle_color;
}
