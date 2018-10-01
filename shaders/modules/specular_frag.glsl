//获取高光值
float glossiness = u_glossiness;
//获取镜面反射基本颜色
vec3 specularColor = u_specular;
vec4 specularMapColor = texture2D(s_specular, v_uv);
specularColor.xyz = specularMapColor.xyz;
glossiness = glossiness * specularMapColor.w;