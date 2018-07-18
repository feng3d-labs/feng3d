attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

varying vec4 v_directionalShadowCoord;

void main(void) {

    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * worldPosition;
    
    v_directionalShadowCoord = gl_Position;
    v_directionalShadowCoord.xyz /= v_directionalShadowCoord.w;
    v_directionalShadowCoord = (v_directionalShadowCoord + 1.0) / 2.0;
}