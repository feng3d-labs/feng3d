#version 300 es
#define FRAG_COLOR_LOCATION 0

precision highp float;
precision highp int;

uniform sampler2D materialDiffuse0;
uniform sampler2D materialDiffuse1;

in vec2 v_st;

layout(location = FRAG_COLOR_LOCATION) out vec4 color;

void main()
{
    if (v_st.y / v_st.x < 1.0) {
        color = texture(materialDiffuse0, v_st);
    } else {
        color = texture(materialDiffuse1, v_st) * 0.77;
    }
}
