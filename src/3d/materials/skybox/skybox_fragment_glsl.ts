export default `precision highp float;

uniform samplerCube s_skyBoxTexture;
uniform vec3 u_cameraPos;

varying vec3 v_worldPos;

void main()
{
    vec3 cameraDir = normalize(u_cameraPos.xyz - v_worldPos);
    gl_FragColor = textureCube(s_skyBoxTexture, -cameraDir);
}`;
