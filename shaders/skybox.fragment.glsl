

precision highp float;

uniform samplerCube s_skyboxTexture;
uniform mat4 u_cameraMatrix;

varying vec3 v_worldPos;



void main(){
    vec3 viewDir = normalize(v_worldPos - u_cameraMatrix[3].xyz);
    gl_FragColor = textureCube(s_skyboxTexture, viewDir);
}