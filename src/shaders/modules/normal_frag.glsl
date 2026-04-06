//获取法线
vec3 normal = texture2D(s_normal,v_uv).xyz * 2.0 - 1.0;
normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);