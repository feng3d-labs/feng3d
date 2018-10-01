//获取漫反射基本颜色
vec4 diffuseColor = u_diffuse;
diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);