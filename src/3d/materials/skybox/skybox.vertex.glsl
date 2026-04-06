attribute vec3 a_position;

uniform vec3 u_cameraPos;
uniform mat4 u_viewProjection;

uniform float u_skyBoxSize;

varying vec3 v_worldPos;

void main()
{
    vec3 worldPos = a_position.xyz * u_skyBoxSize + u_cameraPos.xyz;
    gl_Position = u_viewProjection * vec4(worldPos.xyz, 1.0);
    v_worldPos = worldPos;
}