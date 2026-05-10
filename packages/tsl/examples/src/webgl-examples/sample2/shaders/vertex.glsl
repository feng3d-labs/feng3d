attribute vec2 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  vec4 position = vec4(aVertexPosition, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * position;
}

