uniform samplerCube s_envMap;
uniform float u_reflectivity;

vec4 envmapMethod(vec4 finalColor)
{
    vec3 cameraToVertex = normalize( v_worldPosition - u_cameraPos );
    vec3 reflectVec = reflect( cameraToVertex, v_normal );
    vec4 envColor = textureCube( s_envMap, reflectVec );
    finalColor.xyz *= envColor.xyz * u_reflectivity;
    return finalColor;
}