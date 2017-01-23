#version 300 es

precision highp float;

uniform samplerCube s_skyboxTexture;
uniform mat4 u_cameraMatrix;

in vec3 v_worldPos;

out vec4 o_fragColor;

void main(){
    vec3 viewDir = normalize(v_worldPos - u_cameraMatrix[3].xyz);
    o_fragColor = texture(s_skyboxTexture, viewDir);
}