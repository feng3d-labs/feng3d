#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D diffuse;

in vec2 v_uv;
in vec3 vPosition;

out vec4 color;

void main()
{
    vec2 size = vec2(textureSize(diffuse, 0));
    vec2 dx = dFdx(v_uv * size);
    vec2 dy = dFdy(v_uv * size);
    color = textureGrad(diffuse, v_uv, dx, dy);

    // Compute flat normal using gradient
    vec3 fdx = vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z));
    vec3 fdy = vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z));

    vec3 N = normalize(cross(fdx, fdy));
    color = mix(color, vec4(N, 1.0), 0.5);
}

