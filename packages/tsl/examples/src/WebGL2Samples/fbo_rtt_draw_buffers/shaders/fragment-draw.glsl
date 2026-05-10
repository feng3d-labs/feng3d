#version 300 es

precision highp float;
precision highp int;

uniform sampler2D color1Map;
uniform sampler2D color2Map;

in vec2 v_st;

out vec4 color;

void main()
{
    vec4 color1 = texture(color1Map, v_st);
    vec4 color2 = texture(color2Map, v_st);
    color = mix(color1, color2, v_st.x);
}
