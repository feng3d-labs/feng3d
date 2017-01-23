#version 300 es

in vec3 a_position;

uniform mat4 u_cameraMatrix;
uniform mat4 u_viewProjection;

uniform vec3 u_skyBoxSize;

out vec3 v_worldPos;

void main(){
    vec3 worldPos = a_position.xyz * u_skyBoxSize.xyz + u_cameraMatrix[3].xyz;
    gl_Position = u_viewProjection * vec4(worldPos.xyz,1.0);
    v_worldPos = worldPos;
}