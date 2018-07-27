// 灯光声明

#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
    // 方向光源投影矩阵列表
    uniform mat4 u_directionalShadowMatrixs[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
    // 方向光源投影uv列表
    varying vec4 v_directionalShadowCoord[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
#endif