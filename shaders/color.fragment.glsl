#version 300 es

precision mediump float;

uniform vec4 u_diffuseInput;

out vec4 o_fragColor;

void main(void) {
   
    o_fragColor = u_diffuseInput;
}
