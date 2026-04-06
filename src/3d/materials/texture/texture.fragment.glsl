precision mediump float;

uniform sampler2D s_texture;
varying vec2 v_uv;

uniform vec4 u_color;

void main() {

    vec4 color = texture2D(s_texture, v_uv);
    gl_FragColor = color * u_color;
}
