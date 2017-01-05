#if NUM_POINTLIGHT > 0
    vec3 t_normal = v_normal;
    finalColor = pointLightShading(finalColor,t_normal);
#endif