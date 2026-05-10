#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform sampler3D diffuse;

in vec3 v_texcoord;

out vec4 color;

void main()
{
    color = texture(diffuse, v_texcoord);
}

