attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

#if NEED_UV > 0
    attribute vec2 a_uv;
#endif

#if NEED_UV_V > 0
    varying vec2 v_uv;
#endif

void main(void) {

    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);

#if NEED_UV_V > 0
    v_uv = a_uv;
#endif

}