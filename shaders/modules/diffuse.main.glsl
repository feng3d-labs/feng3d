finalColor = u_diffuse;
#ifdef HAS_DIFFUSE_MAP
    finalColor = finalColor * texture2D(s_diffuse, v_uv);
#endif