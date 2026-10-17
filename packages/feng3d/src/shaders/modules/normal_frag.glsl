// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
//获取法线
vec3 normal = texture2D(s_normal,v_uv).xyz * 2.0 - 1.0;
normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);