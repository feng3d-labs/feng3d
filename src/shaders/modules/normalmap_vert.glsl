//计算法线
v_normal = normalize((u_ITModelMatrix * vec4(normal, 0.0)).xyz);
v_tangent = normalize((u_modelMatrix * vec4(tangent, 0.0)).xyz);
v_bitangent = cross(v_normal, v_tangent);