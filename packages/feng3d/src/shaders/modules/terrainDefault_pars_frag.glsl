// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
uniform sampler2D s_splatTexture1;
uniform sampler2D s_splatTexture2;
uniform sampler2D s_splatTexture3;

uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) 
{
    vec4 blend = texture2D(s_blendTexture, v_uv);

    vec2 t_uv = v_uv.xy * u_splatRepeats.y;
    vec4 tColor = texture2D(s_splatTexture1, t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.z;
    tColor = texture2D(s_splatTexture2, t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.w;
    tColor = texture2D(s_splatTexture3, t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;

    return diffuseColor;
}