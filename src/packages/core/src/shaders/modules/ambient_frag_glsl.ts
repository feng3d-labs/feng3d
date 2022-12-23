export default `//环境光
vec3 ambientColor = u_ambient.w * u_ambient.xyz * u_sceneAmbientColor.xyz * u_sceneAmbientColor.w;
ambientColor = ambientColor * texture2D(s_ambient, v_uv).xyz;`;
