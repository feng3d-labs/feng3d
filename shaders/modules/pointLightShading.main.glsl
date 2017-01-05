#if NUM_POINTLIGHT > 0
    vec3 t_normal = v_normal;
    finalColor = finalColor * 0.5 +  pointLightShading(finalColor,t_normal) * 0.5;
#endif