#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uSampler;

in vec2 vTextureCoord;
in vec4 vFragPosition;

layout(location = 0) out vec4 color;

void main() {
    color = texture(uSampler, vTextureCoord) * vFragPosition;
}