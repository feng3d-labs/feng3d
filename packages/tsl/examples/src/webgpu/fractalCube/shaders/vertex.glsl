#version 300 es

precision highp float;
precision highp int;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

layout(location = 0) in vec3 aVertexPosition;
layout(location = 1) in vec2 aTextureCoord;

out vec2 vTextureCoord;
out vec4 vFragPosition;

void main() {
    vec4 position = vec4(aVertexPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * position;
    vTextureCoord = aTextureCoord;
    vec4 fragPos = 0.5 * (vec4(aVertexPosition, 1.0) + vec4(1.0));
    vFragPosition = fragPos;
}