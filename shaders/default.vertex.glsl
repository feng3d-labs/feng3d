attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#if A_UV_NEED > 0
    attribute vec2 a_uv;
#endif

#if A_NORMAL_NEED >0
    attribute vec3 a_normal;
#endif

#if V_UV_NEED > 0
    varying vec2 v_uv;
#endif

#if V_GLOBAL_POSITION_NEED > 0
    varying vec3 v_globalPosition;
#endif

#if V_NORMAL_NEED > 0
    varying vec3 v_normal;
#endif

void main(void) {

    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
    gl_Position = u_viewProjection * globalPosition;

#if V_GLOBAL_POSITION_NEED > 0
    v_globalPosition = globalPosition.xyz;
#endif

#if V_UV_NEED > 0
    v_uv = a_uv;
#endif

#if V_NORMAL_NEED > 0
    v_normal = a_normal;
#endif

}