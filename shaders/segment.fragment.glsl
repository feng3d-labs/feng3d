
precision mediump float;

varying vec4 v_color;

uniform vec3 u_segmentColor;
uniform float u_segmentAlpha;

void main(void) {
    gl_FragColor = v_color * vec4(u_segmentColor,u_segmentAlpha);
}