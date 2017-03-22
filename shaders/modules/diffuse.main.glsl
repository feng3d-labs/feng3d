finalColor = u_baseColor;
#ifdef HAS_DIFFUSE_MAP
    finalColor = finalColor * texture2D(s_texture, v_uv);
#endif