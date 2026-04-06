export default `v_uv = a_uv;
#ifdef SCALEU
    #ifdef SCALEV
    v_uv = v_uv * vec2(SCALEU,SCALEV);
    #endif
#endif`;
