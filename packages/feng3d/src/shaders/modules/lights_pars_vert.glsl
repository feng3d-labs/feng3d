// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
// 灯光声明

#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
    // 方向光源投影矩阵列表
    uniform mat4 u_directionalShadowMatrices[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
    // 方向光源投影uv列表
    varying vec4 v_directionalShadowCoord[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
#endif

#if NUM_SPOT_LIGHTS_CASTSHADOW > 0
    // 聚光灯投影矩阵列表
    uniform mat4 u_spotShadowMatrix[ NUM_SPOT_LIGHTS_CASTSHADOW ];
    // 聚光灯投影uv列表
    varying vec4 v_spotShadowCoord[ NUM_SPOT_LIGHTS_CASTSHADOW ];
#endif