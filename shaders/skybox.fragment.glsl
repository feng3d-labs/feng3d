uniform samplerCube s_skyboxTexture;
uniform mat4 u_cameraMatrix;

varying vec3 v_worldPos;

out vec4 o_fragColor;

void main(){
    vec3 viewDir = normalize(v_worldPos - u_cameraMatrix[3].xyz);
    o_fragColor.xyz = texture(s_skyboxTexture,viewDir).xyz;
    o_fragColor.w = 1.0;
}