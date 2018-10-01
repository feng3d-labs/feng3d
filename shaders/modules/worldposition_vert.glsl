//获取全局坐标
vec4 worldPosition = u_modelMatrix * position;
//输出全局坐标
v_worldPosition = worldPosition.xyz;