precision mediump float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
  
varying vec2 vUv;
varying vec3 vNormal;
  
uniform mat4 projection, view;
  
void main() {
  vUv = uv;
  vNormal = normal;
  gl_Position = projection * view * vec4(position, 1);
}