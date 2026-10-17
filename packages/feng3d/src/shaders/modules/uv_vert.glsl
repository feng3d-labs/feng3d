// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
v_uv = a_uv;
#ifdef SCALEU
    #ifdef SCALEV
    v_uv = v_uv * vec2(SCALEU,SCALEV);
    #endif
#endif