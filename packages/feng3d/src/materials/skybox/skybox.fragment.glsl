// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision highp float;

uniform samplerCube s_skyBoxTexture;
uniform vec3 u_cameraPos;

varying vec3 v_worldPos;

void main()
{
    vec3 cameraDir = normalize(u_cameraPos.xyz - v_worldPos);
    gl_FragColor = textureCube(s_skyBoxTexture, -cameraDir);
}