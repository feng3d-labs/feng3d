//基本颜色
uniform vec4 u_diffuse;
#ifdef HAS_DIFFUSE_MAP
    uniform sampler2D s_diffuse;
#endif