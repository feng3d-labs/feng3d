// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
//计算法线
v_normal = normalize((u_ITModelMatrix * vec4(normal, 0.0)).xyz);
v_tangent = normalize((u_modelMatrix * vec4(tangent, 0.0)).xyz);
v_bitangent = cross(v_normal, v_tangent);