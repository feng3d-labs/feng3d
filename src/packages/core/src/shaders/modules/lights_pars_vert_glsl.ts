export default `// 灯光声明

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
#endif`;
