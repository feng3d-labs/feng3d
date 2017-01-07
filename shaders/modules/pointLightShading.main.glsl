#if NUM_POINTLIGHT > 0
    // finalColor = finalColor * 0.5 +  pointLightShading(v_normal,u_baseColor) * 0.5;
    finalColor.xyz = pointLightShading(v_normal,finalColor.xyz);
#endif