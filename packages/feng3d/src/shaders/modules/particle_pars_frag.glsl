// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
#ifdef HAS_PARTICLE_ANIMATOR
    varying vec4 v_particle_color;

    vec4 particleAnimation(vec4 color) {

        color.xyz = color.xyz * v_particle_color.xyz;
        color.xyz = color.xyz * v_particle_color.www;
        return color;
    }
#endif