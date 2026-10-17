// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
//获取高光值
float glossiness = u_glossiness;
//获取镜面反射基本颜色
vec3 specularColor = u_specular;
vec4 specularMapColor = texture2D(s_specular, v_uv);
specularColor.xyz = specularMapColor.xyz;
glossiness = glossiness * specularMapColor.w;