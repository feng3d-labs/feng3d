precision highp float;

uniform samplerCube s_skyboxTexture;
uniform mat4 u_cameraMatrix;

varying vec3 v_worldPos;

void main(){
    vec3 cameraDir = normalize(u_cameraMatrix[3].xyz - v_worldPos);
    gl_FragColor = textureCube(s_skyboxTexture, -cameraDir);
}