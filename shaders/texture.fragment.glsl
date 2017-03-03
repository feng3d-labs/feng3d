

precision mediump float;

uniform sampler2D s_texture;
varying vec2 v_uv;



void main(void) {

    gl_FragColor = texture2D(s_texture, v_uv);
}
