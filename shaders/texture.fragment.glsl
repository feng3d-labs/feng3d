#version 300 es

precision mediump float;

uniform sampler2D s_texture;
in vec2 v_uv;

out vec4 o_fragColor;

void main(void) {

    o_fragColor = texture(s_texture, v_uv);
}
