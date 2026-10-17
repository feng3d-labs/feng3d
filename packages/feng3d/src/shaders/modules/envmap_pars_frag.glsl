// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
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