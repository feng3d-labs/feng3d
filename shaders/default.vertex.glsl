attribute vec3 vaPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

#if NEED_UV > 0
    attribute vec2 vaUV;
#endif

#if NEED_UV_V > 0
    varying vec2 uv_v;
#endif

void main(void) {

    gl_Position = uPMatrix * uMVMatrix * vec4(vaPosition, 1.0);

#if NEED_UV_V > 0
    uv_v = vaUV;
#endif

}