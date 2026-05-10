#version 300 es
precision highp float;
precision highp int;

in float v_attribute;
out vec4 color;

void main()
{
    const vec4 blue   = vec4( 0.0, 0.0, 1.0, 1.0 );
    const vec4 yellow = vec4( 1.0, 1.0, 0.0, 1.0 );
    color = v_attribute >= 0.0 ? mix(blue, yellow, sqrt(v_attribute)) : yellow;
}
